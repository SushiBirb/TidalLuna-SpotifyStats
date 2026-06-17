// src/spotify.ts
async function getSpotifyArtistListeners(artistName) {
  try {
    const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=site:open.spotify.com/artist+${encodeURIComponent(artistName)}`);
    const searchHtml = await searchRes.text();
    const idMatch = searchHtml.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
    if (!idMatch) return null;
    const spotifyId = idMatch[1];
    const spotifyRes = await fetch(`https://open.spotify.com/artist/${spotifyId}`);
    const spotifyHtml = await spotifyRes.text();
    const listenersMatch = spotifyHtml.match(/([0-9.,]+[KMB]?)\s+monthly listeners/i);
    if (listenersMatch) {
      return listenersMatch[1];
    }
    return null;
  } catch (err) {
    console.error("SpotifyStats Plugin Error:", err);
    return null;
  }
}
async function getSpotifyTrackPlays(trackName, artistName) {
  try {
    const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=site:open.spotify.com/track+${encodeURIComponent(trackName + " " + artistName)}`);
    const searchHtml = await searchRes.text();
    const idMatch = searchHtml.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (!idMatch) return null;
    const spotifyId = idMatch[1];
    const spotifyRes = await fetch(`https://open.spotify.com/track/${spotifyId}`);
    const spotifyHtml = await spotifyRes.text();
    const playsMatch = spotifyHtml.match(/"playcount"\s*:\s*"([0-9]+)"/i) || spotifyHtml.match(/"playcount"\s*:\s*([0-9]+)/i);
    if (playsMatch) {
      const num = parseInt(playsMatch[1], 10);
      return num.toLocaleString();
    }
    return null;
  } catch (err) {
    console.error("SpotifyStats Plugin Error:", err);
    return null;
  }
}

// src/dom.ts
var cache = {};
function startObserver() {
  const observer = new MutationObserver(async (mutations) => {
    const elements = document.evaluate(
      "//*[contains(text(), 'Fans')]",
      document,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0; i < elements.snapshotLength; i++) {
      const el = elements.snapshotItem(i);
      if (el && el.innerText && el.innerText.includes("Fans") && !el.dataset.spotifyStats) {
        let artistName = document.title.replace(" on TIDAL", "").trim();
        el.dataset.spotifyStats = "true";
        const cacheKey = `artist:${artistName}`;
        let listeners = cache[cacheKey];
        if (!listeners) {
          listeners = await getSpotifyArtistListeners(artistName) || "N/A";
          cache[cacheKey] = listeners;
        }
        if (listeners !== "N/A") {
          el.innerText = `${el.innerText} | ${listeners} Spotify Listeners`;
        }
      }
    }
    const trackRows = document.querySelectorAll('[data-test="tracklist-row"]');
    for (let row of Array.from(trackRows)) {
      const rowEl = row;
      if (!rowEl.dataset.spotifyStats) {
        rowEl.dataset.spotifyStats = "true";
        const titleEl = rowEl.querySelector('[data-test="table-row-title"]');
        let artistName = document.title.split(" by ")[1]?.replace(" on TIDAL", "") || document.title.replace(" on TIDAL", "");
        if (titleEl && titleEl.textContent) {
          const trackName = titleEl.textContent.trim();
          const cacheKey = `track:${artistName}:${trackName}`;
          let plays = cache[cacheKey];
          if (!plays) {
            getSpotifyTrackPlays(trackName, artistName).then((fetchedPlays) => {
              if (fetchedPlays) {
                cache[cacheKey] = fetchedPlays;
                const durationEl = rowEl.querySelector('[data-test="duration"]') || titleEl;
                if (durationEl) {
                  const span = document.createElement("span");
                  span.style.color = "#1db954";
                  span.style.fontSize = "0.85em";
                  span.style.marginLeft = "10px";
                  span.textContent = `\u25B6 ${fetchedPlays}`;
                  durationEl.appendChild(span);
                }
              } else {
                cache[cacheKey] = "N/A";
              }
            });
          } else if (plays !== "N/A") {
            const durationEl = rowEl.querySelector('[data-test="duration"]') || titleEl;
            if (durationEl) {
              const span = document.createElement("span");
              span.style.color = "#1db954";
              span.style.fontSize = "0.85em";
              span.style.marginLeft = "10px";
              span.textContent = `\u25B6 ${plays}`;
              durationEl.appendChild(span);
            }
          }
        }
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  return observer;
}

// src/index.ts
var unloads = /* @__PURE__ */ new Set();
setTimeout(() => {
  const observer = startObserver();
  unloads.add(() => observer.disconnect());
  console.log("[SpotifyStats] Plugin loaded and observer started");
}, 1e3);
export {
  unloads
};
