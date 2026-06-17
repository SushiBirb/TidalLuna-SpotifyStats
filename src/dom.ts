import { getSpotifyArtistListeners, getSpotifyTrackPlays } from "./spotify";

let cache: Record<string, string> = {};

function formatNumber(numStr: string) {
    return numStr; // Already formatted by our regex or fetch
}

export function startObserver() {
    const observer = new MutationObserver(async (mutations) => {
        // 1. Process Artist Fans
        // Look for text like "123k Fans"
        const elements = document.evaluate(
            "//*[contains(text(), 'Fans')]",
            document,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        for (let i = 0; i < elements.snapshotLength; i++) {
            const el = elements.snapshotItem(i) as HTMLElement;
            if (el && el.innerText && el.innerText.includes("Fans") && !el.dataset.spotifyStats) {
                // Find artist name. Usually it's in a header or we can get it from the page title.
                // Tidal page title: "Slayer on TIDAL"
                let artistName = document.title.replace(" on TIDAL", "").trim();
                
                // Set flag to prevent infinite loops
                el.dataset.spotifyStats = "true";

                // Read from cache or fetch
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

        // 2. Process Album Track Plays
        // This is highly dependent on Tidal's DOM structure. 
        // We'll look for track rows. Tidal track rows usually have a data-test="tracklist-row"
        const trackRows = document.querySelectorAll('[data-test="tracklist-row"]');
        for (let row of Array.from(trackRows)) {
            const rowEl = row as HTMLElement;
            if (!rowEl.dataset.spotifyStats) {
                rowEl.dataset.spotifyStats = "true";

                // Extract track name and artist name
                // Usually the title is in an element with data-test="table-row-title"
                const titleEl = rowEl.querySelector('[data-test="table-row-title"]');
                // The artist might be the page title if we are on an album page
                let artistName = document.title.split(" by ")[1]?.replace(" on TIDAL", "") || document.title.replace(" on TIDAL", "");
                
                if (titleEl && titleEl.textContent) {
                    const trackName = titleEl.textContent.trim();
                    const cacheKey = `track:${artistName}:${trackName}`;
                    
                    let plays = cache[cacheKey];
                    if (!plays) {
                        getSpotifyTrackPlays(trackName, artistName).then(fetchedPlays => {
                            if (fetchedPlays) {
                                cache[cacheKey] = fetchedPlays;
                                // Inject plays into the row. e.g. next to the title or duration.
                                const durationEl = rowEl.querySelector('[data-test="duration"]') || titleEl;
                                if (durationEl) {
                                    const span = document.createElement('span');
                                    span.style.color = '#1db954'; // Spotify green
                                    span.style.fontSize = '0.85em';
                                    span.style.marginLeft = '10px';
                                    span.textContent = `▶ ${fetchedPlays}`;
                                    durationEl.appendChild(span);
                                }
                            } else {
                                cache[cacheKey] = "N/A";
                            }
                        });
                    } else if (plays !== "N/A") {
                        const durationEl = rowEl.querySelector('[data-test="duration"]') || titleEl;
                        if (durationEl) {
                            const span = document.createElement('span');
                            span.style.color = '#1db954';
                            span.style.fontSize = '0.85em';
                            span.style.marginLeft = '10px';
                            span.textContent = `▶ ${plays}`;
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
