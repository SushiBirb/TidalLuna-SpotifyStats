import { getSpotifyListeners } from "./spotify";
import { getTrackPlays } from "./lastfm";

const CACHE = new Map<string, string>();

function getSettings() {
    return localStorage.getItem('spotifystats_mode') || 'replace';
}

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
  const artistNameEl = document.querySelector('h1[data-test="artist-title"], h1.artist-title, [data-test="artist-title"], h1');
  const artistName = artistNameEl?.textContent?.trim();
  if (!artistName) return;

  // Find the fans element by looking for text "Fans"
  let fansEl = document.querySelector('[data-test="artist-fans"]');
  if (!fansEl) {
    // Fallback: search all divs/spans for "Fans"
    const elements = document.querySelectorAll('div, span, p');
    for (const el of Array.from(elements)) {
      const text = el.textContent?.trim() || '';
      if (text.match(/^[0-9,KMB.]+\s+Fans$/i)) {
        fansEl = el as Element;
        break;
      }
    }
  }

  if (!fansEl || fansEl.hasAttribute('data-lastfm-injected')) return;
  if (fansEl.textContent?.includes('Listeners')) return; // Already injected
  
  const cacheKey = `artist_spotify:${artistName}`;
  let listeners = CACHE.get(cacheKey);
  
  if (!listeners) {
    CACHE.set(cacheKey, "fetching");
    fansEl.setAttribute('data-lastfm-injected', 'fetching');
    const data = await getSpotifyListeners(artistName);
    listeners = data || "N/A";
    CACHE.set(cacheKey, listeners);
  } else if (listeners === "fetching") {
    return;
  }
  
  if (listeners !== "N/A") {
    const mode = getSettings();
    const originalText = fansEl.getAttribute('data-original-text') || fansEl.textContent;
    if (!fansEl.hasAttribute('data-original-text')) {
      fansEl.setAttribute('data-original-text', originalText || '');
    }
    
    if (mode === 'both') {
      fansEl.textContent = `${listeners} Listeners | Tidal: ${originalText}`;
    } else {
      fansEl.textContent = `${listeners} Listeners`;
    }
    fansEl.setAttribute('data-lastfm-injected', 'true');
  } else {
    fansEl.removeAttribute('data-lastfm-injected');
  }
}

async function injectTrackPlays() {
  const trackRows = document.querySelectorAll('[data-test="tracklist-row"], [role="row"]');
  if (trackRows.length === 0) return;
  
  const albumArtistEl = document.querySelector('[data-test="album-artist"], .album-artist');
  const albumArtist = albumArtistEl?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim();
  if (!albumArtist) return;
  
  for (const row of Array.from(trackRows)) {
    if (row.hasAttribute('data-lastfm-injected')) continue;
    
    const titleEl = row.querySelector('[data-test="track-title"], [class*="title"]');
    const trackName = titleEl?.textContent?.trim();
    if (!trackName) continue;
    
    row.setAttribute('data-lastfm-injected', 'fetching');
    
    const cacheKey = `track:${albumArtist}:${trackName}`;
    let plays = CACHE.get(cacheKey);
    
    if (!plays) {
      const data = await getTrackPlays(trackName, albumArtist);
      plays = data || "N/A";
      CACHE.set(cacheKey, plays);
    }
    
    if (plays !== "N/A") {
      const durationEl = row.querySelector('[data-test="track-duration"], [class*="duration"]');
      if (durationEl && !durationEl.parentElement?.querySelector('.spotify-stats-plays')) {
        const playsSpan = document.createElement('span');
        playsSpan.className = 'spotify-stats-plays';
        playsSpan.style.marginRight = '15px';
        playsSpan.style.color = '#888';
        playsSpan.style.fontSize = '0.9em';
        playsSpan.textContent = `▶ ${plays}`;
        durationEl.parentElement?.insertBefore(playsSpan, durationEl);
      }
    }
    row.setAttribute('data-lastfm-injected', 'true');
  }
}
