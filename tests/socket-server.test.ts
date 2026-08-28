import { createServer, type Server as HttpServer } from "node:http";
import { io as createClient, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { attachSocketServer } from "@/server/_core/socket";

const servers: HttpServer[] = [];
const clients: Socket[] = [];

async function startServer(): Promise<{ server: HttpServer; port: number }> {
  const server = createServer();
  attachSocketServer(server);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Socket test server did not bind");
  return { server, port: address.port };
}

afterEach(async () => {
  for (const client of clients.splice(0)) client.close();
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

describe("Socket.io server bootstrap", () => {
  it("exposes the configured Socket.io path", async () => {
    process.env.JWT_SECRET = "socket-test-secret";
    const { port } = await startServer();
    const client = createClient(`http://127.0.0.1:${port}`, {
      path: "/socket.io",
      transports: ["polling"],
      timeout: 500,
    });
    clients.push(client);

    await expect(
      new Promise<void>((resolve, reject) => {
        client.once("connect", () => reject(new Error("unauthenticated client connected")));
        client.once("connect_error", () => resolve());
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects an unauthenticated dashboard connection", async () => {
    process.env.JWT_SECRET = "socket-test-secret";
    const { port } = await startServer();
    const client = createClient(`http://127.0.0.1:${port}`, {
      auth: {},
      transports: ["websocket"],
      timeout: 500,
    });
    clients.push(client);

    await expect(
      new Promise<void>((resolve, reject) => {
        client.once("connect", () => reject(new Error("unauthenticated client connected")));
        client.once("connect_error", (error) => {
          expect(error.message).toContain("Unauthorized");
          resolve();
        });
      }),
    ).resolves.toBeUndefined();
  });
});
