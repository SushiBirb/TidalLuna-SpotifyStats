import { setupDOMObserver } from "./dom";
import { Settings } from "./settings";

export const unloads = new Set<any>();

console.log("[Stats Plugin] Initializing...");
const disconnect = setupDOMObserver();
unloads.add(disconnect);

export { Settings };
