export function Settings() {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.color = "white";
    
    const h2 = document.createElement("h2");
    h2.textContent = "Stats Plugin Settings";
    h2.style.marginBottom = "10px";
    div.appendChild(h2);

    const desc = document.createElement("p");
    desc.textContent = "Choose how you want the stats to appear on Artist pages. Changes require a plugin reload (or restart Tidal). Tracks use Last.fm playcounts because Spotify track counts are private.";
    desc.style.marginBottom = "20px";
    div.appendChild(desc);

    const select = document.createElement("select");
    select.style.padding = "8px";
    select.style.backgroundColor = "#222";
    select.style.color = "white";
    select.style.border = "1px solid #444";
    select.style.borderRadius = "4px";

    const option1 = document.createElement("option");
    option1.value = "replace";
    option1.textContent = "Just StatsFM (e.g. 5M Listeners)";
    
    const option2 = document.createElement("option");
    option2.value = "both";
    option2.textContent = "StatsFM (Tidal) (e.g. 5M Listeners | Tidal: 229K Fans)";
    
    select.appendChild(option1);
    select.appendChild(option2);
    
    select.value = localStorage.getItem('spotifystats_mode') || 'replace';
    select.onchange = (e) => {
        localStorage.setItem('spotifystats_mode', (e.target as HTMLSelectElement).value);
    };
    
    div.appendChild(select);
    
    const reloadBtn = document.createElement("button");
    reloadBtn.textContent = "Reload to Apply";
    reloadBtn.style.marginLeft = "10px";
    reloadBtn.style.padding = "8px 12px";
    reloadBtn.style.backgroundColor = "#444";
    reloadBtn.style.color = "white";
    reloadBtn.style.border = "none";
    reloadBtn.style.cursor = "pointer";
    reloadBtn.onclick = () => window.location.reload();
    div.appendChild(reloadBtn);

    return div;
}
