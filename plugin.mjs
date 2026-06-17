// src/spotify.ts
async function getSpotifyListeners(artistName) {
  try {
    const wdSearchRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(artistName)}&language=en&format=json`);
    const wdSearch = await wdSearchRes.json();
    if (!wdSearch.search || wdSearch.search.length === 0) return null;
    const entityId = wdSearch.search[0].id;
    const wdClaimsRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P1902&format=json`);
    const wdClaims = await wdClaimsRes.json();
    if (!wdClaims.claims || !wdClaims.claims.P1902 || wdClaims.claims.P1902.length === 0) return null;
    const spotifyId = wdClaims.claims.P1902[0].mainsnak.datavalue.value;
    const spotifyRes = await fetch(`https://open.spotify.com/artist/${spotifyId}`);
    const spotifyHtml = await spotifyRes.text();
    const match = spotifyHtml.match(/([0-9,KMB.]+)\s*monthly listeners/i);
    if (match) {
      return match[1];
    }
    return null;
  } catch (err) {
    console.error("[Stats Plugin] Spotify fetch error:", err);
    return null;
  }
}

// src/lastfm.ts
async function getTrackPlays(trackName, artistName) {
  try {
    const res = await fetch(`https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`);
    const html = await res.text();
    const matches = [...html.matchAll(/<abbr class="intabbr[^>]*title="([0-9,]+)"/gi)];
    if (matches && matches.length > 1) {
      return matches[1][1];
    }
    return null;
  } catch (err) {
    console.error("[Stats Plugin] Track fetch error:", err);
    return null;
  }
}

// src/dom.ts
var CACHE = /* @__PURE__ */ new Map();
function getSettings() {
  return localStorage.getItem("spotifystats_mode") || "replace";
}
function setupDOMObserver() {
  const observer = new MutationObserver(() => {
    injectArtistListeners();
    injectTrackPlays();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  return () => observer.disconnect();
}
async function injectArtistListeners() {
  const artistNameEl = document.querySelector('h1[data-test="artist-title"], h1.artist-title, [data-test="artist-title"], h1');
  const artistName = artistNameEl?.textContent?.trim();
  if (!artistName) return;
  let fansEl = document.querySelector('[data-test="artist-fans"]');
  if (!fansEl) {
    const elements = document.querySelectorAll("div, span, p");
    for (const el of Array.from(elements)) {
      const text = el.textContent?.trim() || "";
      if (text.match(/^[0-9,KMB.]+\s+Fans$/i)) {
        fansEl = el;
        break;
      }
    }
  }
  if (!fansEl || fansEl.hasAttribute("data-lastfm-injected")) return;
  if (fansEl.textContent?.includes("Listeners")) return;
  const cacheKey = `artist_spotify:${artistName}`;
  let listeners = CACHE.get(cacheKey);
  if (!listeners) {
    CACHE.set(cacheKey, "fetching");
    fansEl.setAttribute("data-lastfm-injected", "fetching");
    const data = await getSpotifyListeners(artistName);
    listeners = data || "N/A";
    CACHE.set(cacheKey, listeners);
  } else if (listeners === "fetching") {
    return;
  }
  if (listeners !== "N/A") {
    const mode = getSettings();
    const originalText = fansEl.getAttribute("data-original-text") || fansEl.textContent;
    if (!fansEl.hasAttribute("data-original-text")) {
      fansEl.setAttribute("data-original-text", originalText || "");
    }
    if (mode === "both") {
      fansEl.textContent = `${listeners} Listeners | Tidal: ${originalText}`;
    } else {
      fansEl.textContent = `${listeners} Listeners`;
    }
    fansEl.setAttribute("data-lastfm-injected", "true");
  } else {
    fansEl.removeAttribute("data-lastfm-injected");
  }
}
async function injectTrackPlays() {
  const trackRows = document.querySelectorAll('[data-test="tracklist-row"], [role="row"]');
  if (trackRows.length === 0) return;
  const albumArtistEl = document.querySelector('[data-test="album-artist"], .album-artist');
  const albumArtist = albumArtistEl?.textContent?.trim() || document.querySelector("h1")?.textContent?.trim();
  if (!albumArtist) return;
  for (const row of Array.from(trackRows)) {
    if (row.hasAttribute("data-lastfm-injected")) continue;
    const titleEl = row.querySelector('[data-test="track-title"], [class*="title"]');
    const trackName = titleEl?.textContent?.trim();
    if (!trackName) continue;
    row.setAttribute("data-lastfm-injected", "fetching");
    const cacheKey = `track:${albumArtist}:${trackName}`;
    let plays = CACHE.get(cacheKey);
    if (!plays) {
      const data = await getTrackPlays(trackName, albumArtist);
      plays = data || "N/A";
      CACHE.set(cacheKey, plays);
    }
    if (plays !== "N/A") {
      const durationEl = row.querySelector('[data-test="track-duration"], [class*="duration"]');
      if (durationEl && !durationEl.parentElement?.querySelector(".spotify-stats-plays")) {
        const playsSpan = document.createElement("span");
        playsSpan.className = "spotify-stats-plays";
        playsSpan.style.marginRight = "15px";
        playsSpan.style.color = "#888";
        playsSpan.style.fontSize = "0.9em";
        playsSpan.textContent = `\u25B6 ${plays}`;
        durationEl.parentElement?.insertBefore(playsSpan, durationEl);
      }
    }
    row.setAttribute("data-lastfm-injected", "true");
  }
}

// src/settings.ts
function Settings() {
  const div = document.createElement("div");
  div.style.padding = "20px";
  div.style.color = "white";
  const h2 = document.createElement("h2");
  h2.textContent = "Stats Plugin Settings";
  h2.style.marginBottom = "10px";
  div.appendChild(h2);
  const desc = document.createElement("p");
  desc.textContent = "Choose how you want the stats to appear on Artist pages. Changes require a plugin reload (or restart Tidal). Tracks use Last.fm playcounts because Spotify track counts are private.";
  desc.style.marginBottom = "20px";
  div.appendChild(desc);
  const select = document.createElement("select");
  select.style.padding = "8px";
  select.style.backgroundColor = "#222";
  select.style.color = "white";
  select.style.border = "1px solid #444";
  select.style.borderRadius = "4px";
  const option1 = document.createElement("option");
  option1.value = "replace";
  option1.textContent = "Just StatsFM (e.g. 5M Listeners)";
  const option2 = document.createElement("option");
  option2.value = "both";
  option2.textContent = "StatsFM (Tidal) (e.g. 5M Listeners | Tidal: 229K Fans)";
  select.appendChild(option1);
  select.appendChild(option2);
  select.value = localStorage.getItem("spotifystats_mode") || "replace";
  select.onchange = (e) => {
    localStorage.setItem("spotifystats_mode", e.target.value);
  };
  div.appendChild(select);
  const reloadBtn = document.createElement("button");
  reloadBtn.textContent = "Reload to Apply";
  reloadBtn.style.marginLeft = "10px";
  reloadBtn.style.padding = "8px 12px";
  reloadBtn.style.backgroundColor = "#444";
  reloadBtn.style.color = "white";
  reloadBtn.style.border = "none";
  reloadBtn.style.cursor = "pointer";
  reloadBtn.onclick = () => window.location.reload();
  div.appendChild(reloadBtn);
  return div;
}

// src/index.ts
var unloads = /* @__PURE__ */ new Set();
console.log("[Stats Plugin] Initializing...");
var disconnect = setupDOMObserver();
unloads.add(disconnect);
export {
  Settings,
  unloads
};
