export async function getSpotifyArtistListeners(artistName: string): Promise<string | null> {
    try {
        // 1. Find Spotify ID using DuckDuckGo
        const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=site:open.spotify.com/artist+${encodeURIComponent(artistName)}`);
        const searchHtml = await searchRes.text();
        const idMatch = searchHtml.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
        if (!idMatch) return null;
        
        const spotifyId = idMatch[1];
        
        // 2. Fetch Spotify page
        const spotifyRes = await fetch(`https://open.spotify.com/artist/${spotifyId}`);
        const spotifyHtml = await spotifyRes.text();
        
        // 3. Extract listeners using regex
        // Spotify uses meta tags or embedded JSON state for this.
        // Example: <meta property="og:description" content="Artist · 4.8M monthly listeners." />
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

export async function getSpotifyTrackPlays(trackName: string, artistName: string): Promise<string | null> {
    try {
        // 1. Find Spotify Track ID using DuckDuckGo
        const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=site:open.spotify.com/track+${encodeURIComponent(trackName + ' ' + artistName)}`);
        const searchHtml = await searchRes.text();
        const idMatch = searchHtml.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
        if (!idMatch) return null;
        
        const spotifyId = idMatch[1];
        
        // 2. Fetch Spotify page
        const spotifyRes = await fetch(`https://open.spotify.com/track/${spotifyId}`);
        const spotifyHtml = await spotifyRes.text();
        
        // 3. Extract plays using regex
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
