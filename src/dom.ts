import { getArtistListeners, getTrackPlays } from "./lastfm";

const CACHE = new Map<string, string>();

export function setupDOMObserver() {
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
  // Tidal's "Fans" are typically shown in a specific selector, such as .fans or similar.
  // We need to find the artist name and the fans element.
  const artistNameEl = document.querySelector('h1.artist-name, [data-test="artist-title"]');
  const fansEl = document.querySelector('[data-test="artist-fans"], .fans-count');
  
  if (!artistNameEl || !fansEl || fansEl.hasAttribute('data-lastfm-injected')) return;
  
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
    fansEl.setAttribute('data-lastfm-injected', 'true');
  }
}

async function injectTrackPlays() {
  // Tracks in Tidal albums
  const trackRows = document.querySelectorAll('[data-test="tracklist-row"]');
  if (trackRows.length === 0) return;
  
  // Find the album artist
  const albumArtistEl = document.querySelector('[data-test="album-artist"]');
  const albumArtist = albumArtistEl?.textContent?.trim();
  if (!albumArtist) return;
  
  for (const row of Array.from(trackRows)) {
    if (row.hasAttribute('data-lastfm-injected')) continue;
    
    const titleEl = row.querySelector('[data-test="track-title"]');
    const trackName = titleEl?.textContent?.trim();
    if (!trackName) continue;
    
    row.setAttribute('data-lastfm-injected', 'pending');
    
    const cacheKey = `track:${albumArtist}:${trackName}`;
    let plays = CACHE.get(cacheKey);
    
    if (!plays) {
      const data = await getTrackPlays(trackName, albumArtist);
      plays = data || "N/A";
      CACHE.set(cacheKey, plays);
    }
    
    if (plays !== "N/A") {
      // Inject into row
      const durationEl = row.querySelector('[data-test="track-duration"]');
      if (durationEl) {
        const playsSpan = document.createElement('span');
        playsSpan.style.marginRight = '15px';
        playsSpan.style.color = 'var(--text-secondary)';
        playsSpan.style.fontSize = '0.9em';
        playsSpan.textContent = `▶ ${plays}`;
        durationEl.parentElement?.insertBefore(playsSpan, durationEl);
      }
    }
    row.setAttribute('data-lastfm-injected', 'true');
  }
}
