export async function getSpotifyListeners(artistName: string): Promise<string | null> {
  try {
    // 1. Search Wikidata for the artist
    const wdSearchRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(artistName)}&language=en&format=json`);
    const wdSearch = await wdSearchRes.json();
    if (!wdSearch.search || wdSearch.search.length === 0) return null;
    
    const entityId = wdSearch.search[0].id; // e.g. Q131231
    
    // 2. Get the Spotify ID (Property P1902)
    const wdClaimsRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P1902&format=json`);
    const wdClaims = await wdClaimsRes.json();
    
    if (!wdClaims.claims || !wdClaims.claims.P1902 || wdClaims.claims.P1902.length === 0) return null;
    
    const spotifyId = wdClaims.claims.P1902[0].mainsnak.datavalue.value;
    
    // 3. Fetch Spotify Artist Page
    const spotifyRes = await fetch(`https://open.spotify.com/artist/${spotifyId}`);
    const spotifyHtml = await spotifyRes.text();
    
    // 4. Extract monthly listeners
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
