export function Settings() {
    return (
        <div style={{ padding: "20px", color: "white" }}>
            <h2>Last.fm Stats</h2>
            <p>This plugin is currently active and fetching Artist Listeners and Track Plays from Last.fm!</p>
            <p>Note: Spotify stats were originally requested, but Spotify has locked down public API access. Last.fm provides highly accurate play counts and is completely free and open.</p>
        </div>
    );
}
