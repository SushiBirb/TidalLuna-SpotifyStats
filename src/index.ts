import { startObserver } from "./dom";

export const unloads = new Set<() => void>();

setTimeout(() => {
    const observer = startObserver();
    unloads.add(() => observer.disconnect());
    console.log("[SpotifyStats] Plugin loaded and observer started");
}, 1000);
