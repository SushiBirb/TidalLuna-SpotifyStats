// src/lastfm.ts
async function getArtistListeners(artistName) {
  try {
    const res = await fetch(`https://www.last.fm/music/${encodeURIComponent(artistName)}`);
    const html = await res.text();
    const matches = [...html.matchAll(/<abbr class="intabbr[^>]*title="([0-9,]+)"/gi)];
    if (matches && matches.length > 0) {
      return matches[0][1];
    }
    return null;
  } catch (err) {
    console.error("[Stats Plugin] Artist fetch error:", err);
    return null;
  }
}
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
  const artistNameEl = document.querySelector('h1.artist-name, [data-test="artist-title"]');
  const fansEl = document.querySelector('[data-test="artist-fans"], .fans-count');
  if (!artistNameEl || !fansEl || fansEl.hasAttribute("data-lastfm-injected")) return;
  const artistName = artistNameEl.textContent?.trim();
  if (!artistName) return;
  const cacheKey = `artist:${artistName}`;
  let listeners = CACHE.get(cacheKey);
  if (!listeners) {
    const data = await getArtistListeners(artistName);
    listeners = data || "N/A";
    CACHE.set(cacheKey, listeners);
  }
  if (listeners !== "N/A") {
    fansEl.textContent = `${listeners} Listeners (Last.fm)`;
    fansEl.setAttribute("data-lastfm-injected", "true");
  }
}
async function injectTrackPlays() {
  const trackRows = document.querySelectorAll('[data-test="tracklist-row"]');
  if (trackRows.length === 0) return;
  const albumArtistEl = document.querySelector('[data-test="album-artist"]');
  const albumArtist = albumArtistEl?.textContent?.trim();
  if (!albumArtist) return;
  for (const row of Array.from(trackRows)) {
    if (row.hasAttribute("data-lastfm-injected")) continue;
    const titleEl = row.querySelector('[data-test="track-title"]');
    const trackName = titleEl?.textContent?.trim();
    if (!trackName) continue;
    row.setAttribute("data-lastfm-injected", "pending");
    const cacheKey = `track:${albumArtist}:${trackName}`;
    let plays = CACHE.get(cacheKey);
    if (!plays) {
      const data = await getTrackPlays(trackName, albumArtist);
      plays = data || "N/A";
      CACHE.set(cacheKey, plays);
    }
    if (plays !== "N/A") {
      const durationEl = row.querySelector('[data-test="track-duration"]');
      if (durationEl) {
        const playsSpan = document.createElement("span");
        playsSpan.style.marginRight = "15px";
        playsSpan.style.color = "var(--text-secondary)";
        playsSpan.style.fontSize = "0.9em";
        playsSpan.textContent = `\u25B6 ${plays}`;
        durationEl.parentElement?.insertBefore(playsSpan, durationEl);
      }
    }
    row.setAttribute("data-lastfm-injected", "true");
  }
}

// src/index.ts
var unloads = /* @__PURE__ */ new Set();
console.log("[Stats Plugin] Initializing...");
var disconnect = setupDOMObserver();
unloads.add(disconnect);
export {
  unloads
};
