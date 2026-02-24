import "./setup.js";
import { throwIfMissing } from "./utils.js";
import { Client, Databases } from "appwrite";

window.setInterval = setInterval;

function getRealtimeUrl() {
  const endpointUrl = new URL(process.env.APPWRITE_FUNCTION_API_ENDPOINT);
  const realtimeUrl = new URL("/v1/realtime", endpointUrl);
  realtimeUrl.protocol = "wss:";
  realtimeUrl.searchParams.append(
    "project",
    process.env.APPWRITE_FUNCTION_PROJECT_ID,
  );
  realtimeUrl.searchParams.append("channels[]", "account");

  return realtimeUrl.toString();
}

const realtimeClient = new Client()
  .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID);

const channel = `databases.${process.env.APPWRITE_DATABASE_ID}.collections.${process.env.APPWRITE_COLLECTION_ID}.documents.${process.env.APPWRITE_DOCUMENT_ID}`;

realtimeClient.subscribe([channel], (response) => {
  console.log(
    `Received event at ${response.timestamp}. Payload:`,
    response.payload,
  );
  fetch(process.env.EVENT_HEARTBEAT_URL);
});

const serverClient = new Client()
  .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID);

serverClient.headers["X-Appwrite-Key"] = process.env.APPWRITE_API_KEY;

const databases = new Databases(serverClient);

// Update the document every UPDATE_INTERVAL seconds (skipped when APP_ENV=test)
if (process.env.APP_ENV !== "test") {
  const interval = parseInt(process.env.UPDATE_INTERVAL, 10) || 30;
  setInterval(() => {
    databases
      .updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        process.env.APPWRITE_DOCUMENT_ID,
        {
          [process.env.APPWRITE_ATTRIBUTE_KEY]: new Date().toISOString(),
        },
      )
      .then((response) => {
        console.log("Document updated:", response);
      })
      .catch((error) => {
        console.error("Error updating document:", error);
      });
  }, interval * 1000);
}

/**
 * Heartbeat check handler: connects to WebSocket, fetches heartbeat URL.
 * @param {(result: string) => void} callback - Called with "Finished" on success
 */
export default async (callback) => {
  throwIfMissing(process.env, [
    "APPWRITE_FUNCTION_API_ENDPOINT",
    "APPWRITE_FUNCTION_PROJECT_ID",
    "WEBSOCKET_HEARTBEAT_URL",
  ]);

  await new Promise((resolve, reject) => {
    let timeout;
    const websocket = new WebSocket(getRealtimeUrl(), {
      timeout: 5000,
    });

    const waitMs = parseInt(process.env.WEBSOCKET_WAIT_MS, 10) || 5000;
    websocket.addEventListener("open", () => {
      timeout = setTimeout(async () => {
        try {
          await fetch(process.env.WEBSOCKET_HEARTBEAT_URL);
          websocket.close();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, waitMs);
    });

    websocket.addEventListener("error", (event) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${event.message}: ${event.error}`));
    });

    websocket.addEventListener("close", (event) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket closed: ${event.reason}`));
    });
  });

  callback("Finished");
};
