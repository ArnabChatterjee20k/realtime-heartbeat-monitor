import http from "node:http";

/**
 * Mock HTTP server for BetterStack/uptime heartbeat URLs.
 * Responds with 200 OK to any request.
 * @param {number} port
 * @returns {Promise<{ server: import('http').Server; url: string; close: () => Promise<void> }>}
 */
export function createMockHttpServer(port = 0) {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const { port: actualPort } = server.address();
      const url = `http://127.0.0.1:${actualPort}`;
      resolve({
        server,
        url,
        close: () => new Promise((cb) => server.close(cb)),
      });
    });
  });
}
