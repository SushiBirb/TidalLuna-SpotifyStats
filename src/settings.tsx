import React from "react";

function getSettings() {
    return localStorage.getItem('spotifystats_mode') || 'replace';
}

function setSettings(mode: string) {
    localStorage.setItem('spotifystats_mode', mode);
}

export const Settings = () => {
    const [mode, setMode] = React.useState(getSettings());

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value;
        setMode(newMode);
        setSettings(newMode);
        
        // Remove tracking attributes to force re-render next time we visit
        document.querySelectorAll('[data-lastfm-injected]').forEach(el => {
            el.removeAttribute('data-lastfm-injected');
        });
    };

    return (
        <div style={{ padding: "20px", color: "white" }}>
            <h2>Spotify & Last.fm Stats</h2>
            <p style={{ marginBottom: "15px" }}>Choose how you want artist listeners to be displayed:</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label>Display Mode: </label>
                <select 
                    value={mode} 
                    onChange={handleChange}
                    style={{
                        background: "#222",
                        color: "white",
                        border: "1px solid #444",
                        padding: "8px",
                        borderRadius: "4px"
                    }}
                >
                    <option value="replace">Replace Tidal stats with Spotify stats</option>
                    <option value="both">Show both (Spotify | Tidal)</option>
                </select>
            </div>
            <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#888" }}>
                Note: You may need to refresh the page or click to another artist for changes to apply.
            </p>
        </div>
    );
};
