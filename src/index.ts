import { setupDOMObserver } from "./dom";

export const unloads = new Set<any>();

console.log("[Stats Plugin] Initializing...");
const disconnect = setupDOMObserver();
unloads.add(disconnect);
