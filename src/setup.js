import * as nodeWindowPolyfill from "node-window-polyfill";

nodeWindowPolyfill.register();

// Override localStorage so Appwrite SDK works in Node (Node's experimental localStorage may be broken)
const storage = new nodeWindowPolyfill.InMemoryLocalStorage();
globalThis.localStorage = storage;
if (typeof globalThis.window !== "undefined") {
  globalThis.window.localStorage = storage;
}
