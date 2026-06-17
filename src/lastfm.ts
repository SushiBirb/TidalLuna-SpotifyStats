export async function getArtistListeners(artistName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.last.fm/music/${encodeURIComponent(artistName)}`);
    const html = await res.text();
    const matches = [...html.matchAll(/<abbr class="intabbr[^>]*title="([0-9,]+)"/gi)];
    if (matches && matches.length > 0) {
      return matches[0][1]; // First one is listeners
    }
    return null;
  } catch (err) {
    console.error("[Stats Plugin] Artist fetch error:", err);
    return null;
  }
}

export async function getTrackPlays(trackName: string, artistName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`);
    const html = await res.text();
    const matches = [...html.matchAll(/<abbr class="intabbr[^>]*title="([0-9,]+)"/gi)];
    if (matches && matches.length > 1) {
      return matches[1][1]; // Second one is scrobbles
    }
    return null;
  } catch (err) {
    console.error("[Stats Plugin] Track fetch error:", err);
    return null;
  }
}
