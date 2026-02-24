import handler from "./realtimeMonitor.js";

const intervalMs =
  parseInt(process.env.HEARTBEAT_CHECK_INTERVAL_MS, 10) || 60_000;

const onComplete = (result) => {
  console.log("Heartbeat check completed:", result);
};

console.log("Starting realtime heartbeat monitor...");
console.log(`Running heartbeat check every ${intervalMs / 1000}s`);

async function runCheck() {
  try {
    await handler(onComplete);
  } catch (err) {
    console.error("Heartbeat check failed:", err);
  }
}

setInterval(runCheck, intervalMs);
