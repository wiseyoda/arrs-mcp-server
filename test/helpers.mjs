import { createServer } from "node:http";
import { once } from "node:events";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ProviderRegistry } from "../dist/providers/registry.js";
import { registerSystemTools } from "../dist/tools/index.js";

export async function fixture(t, handler) {
  const calls = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    const call = {
      method: req.method,
      url: new URL(req.url, "http://fixture"),
      headers: req.headers,
      body: body ? JSON.parse(body) : undefined,
    };
    calls.push(call);
    res.setHeader("Content-Type", "application/json");
    try {
      await handler(call, res);
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return { url: `http://127.0.0.1:${server.address().port}`, calls };
}

export async function mcp(t, config) {
  const server = new McpServer({ name: "test", version: "1" });
  for (const name of [
    "sonarr",
    "radarr",
    "plex",
    "sabnzbd",
    "overseerr",
    "tmdb",
  ]) {
    const module = await import(`../dist/services/${name}/tools.js`);
    Object.values(module)[0](server, config);
  }
  registerSystemTools(server, config, new ProviderRegistry(config));
  const client = new Client({ name: "test", version: "1" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  t.after(async () => {
    await client.close();
    await server.close();
  });
  return client;
}
export const text = (result) =>
  result.content.map((c) => c.text || "").join("\n");
