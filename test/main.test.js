import "dotenv/config";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createMockHttpServer } from "./mock-http-server.js";

describe("main handler", () => {
  let mockHttp;
  let originalEnv;

  before(async () => {
    originalEnv = { ...process.env };
    process.env.APP_ENV = "test";
    process.env.WEBSOCKET_WAIT_MS = "100";

    mockHttp = await createMockHttpServer(0);
    process.env.WEBSOCKET_HEARTBEAT_URL = `${mockHttp.url}/websocket-heartbeat`;
    process.env.EVENT_HEARTBEAT_URL = `${mockHttp.url}/event-heartbeat`;
  });

  after(async () => {
    await mockHttp.close();
    process.env = originalEnv;
  });

  it("handler connects to WebSocket, fetches heartbeat URLs, and returns Finished", async () => {
    const handler = (await import("../src/main.js")).default;
    const res = {
      _body: null,
      send(body) {
        this._body = body;
        return this;
      },
    };

    await handler({ res });

    assert.strictEqual(res._body, "Finished");
  });
});
