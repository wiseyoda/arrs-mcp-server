import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fixture, mcp, text } from "./helpers.mjs";

function allConfig(url) {
  return Object.fromEntries(
    [
      "sonarr",
      "radarr",
      "radarr4k",
      "sabnzbd",
      "plex",
      "overseerr",
      "tmdb",
    ].map((name) => [name, { url, apiKey: "dummy", token: "dummy" }]),
  );
}
test("all tools register and expose JSON schemas without name collisions", async (t) => {
  const client = await mcp(t, allConfig("http://127.0.0.1:1"));
  const { tools } = await client.listTools();
  assert.equal(tools.length, 88);
  assert.equal(new Set(tools.map((t) => t.name)).size, tools.length);
  for (const tool of tools)
    assert.equal(tool.inputSchema.type, "object", tool.name);
  for (const name of [
    "movie_search",
    "tv_search",
    "overseerr_users",
    "library_sync",
    "plex_delete",
  ])
    assert.ok(tools.some((t) => t.name === name));
});
test("delete tools require explicit true and string false cannot trigger requests", async (t) => {
  const f = await fixture(t, (_req, res) => res.end("{}"));
  const client = await mcp(t, allConfig(f.url));
  for (const [name, args] of [
    ["movie_delete", { movie_id: 1 }],
    ["sonarr_delete", { series_id: 1 }],
    ["sabnzbd_delete", { nzo_id: "1" }],
    ["plex_delete", { rating_key: "1" }],
    ["overseerr_request_delete", { request_id: 1 }],
  ]) {
    for (const confirm of [undefined, false, "false", "nonsense"]) {
      const result = await client.callTool({
        name,
        arguments: { ...args, ...(confirm === undefined ? {} : { confirm }) },
      });
      assert.equal(result.isError, true, `${name} ${confirm}`);
    }
  }
  assert.equal(f.calls.length, 0);
});
test("confirmed movie deletion retains files by default and never silently uses 4K", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.method === "DELETE") {
      res.writeHead(204);
      res.end();
    } else res.end('{"title":"Fixture"}');
  });
  const config = allConfig(f.url);
  config.radarr4k.url += "/4k";
  const client = await mcp(t, config);
  const result = await client.callTool({
    name: "movie_delete",
    arguments: { movie_id: "12", confirm: "true", delete_files: "false" },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.equal(f.calls[1].url.pathname, "/api/v3/movie/12");
  assert.equal(f.calls[1].url.searchParams.get("deleteFiles"), "false");
  const fourK = await client.callTool({
    name: "movie_delete",
    arguments: { movie_id: 12, confirm: true, quality: "4k" },
  });
  assert.notEqual(fourK.isError, true);
  assert.equal(f.calls[3].url.pathname, "/4k/api/v3/movie/12");
});
test("invalid IDs cannot reach services and missing HD never falls back to 4K", async (t) => {
  const f = await fixture(t, (_req, res) => res.end("[]"));
  const client = await mcp(t, { radarr4k: { url: f.url, apiKey: "dummy" } });
  for (const movie_id of [-1, 1.5, "bad"]) {
    const result = await client.callTool({
      name: "movie_delete",
      arguments: { movie_id, confirm: true },
    });
    assert.equal(result.isError, true);
  }
  const result = await client.callTool({
    name: "movie_search",
    arguments: { query: "Fixture" },
  });
  assert.equal(result.isError, true);
  assert.equal(f.calls.length, 0);
});
test("representative read tools work through real MCP request validation", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname === "/api/v3/series/lookup")
      res.end('[{"title":"Fixture TV","tvdbId":1,"year":2020}]');
    else if (req.url.pathname === "/api/v3/movie/lookup")
      res.end('[{"title":"Fixture Movie","tmdbId":2,"year":2020}]');
    else if (req.url.pathname === "/api/v1/request")
      res.end('{"pageInfo":{"results":0,"pages":0},"results":[]}');
    else if (req.url.pathname === "/api/v1/issue/1/comment")
      res.end('{"id":1,"comments":[{"message":"hello"}]}');
    else if (req.url.pathname === "/library/sections")
      res.end('{"MediaContainer":{"Directory":[]}}');
    else if (req.url.searchParams.get("mode") === "history")
      res.end('{"history":{"slots":[],"noofslots":0}}');
    else {
      res.writeHead(404);
      res.end("{}");
    }
  });
  const client = await mcp(t, allConfig(f.url));
  for (const [name, args] of [
    ["tv_search", { query: "Fixture" }],
    ["movie_search", { query: "Fixture" }],
    ["request_list", {}],
    ["library_list", {}],
    ["downloads_history", { limit: "5" }],
    ["overseerr_issue_comment", { issue_id: "1", comment: "hello" }],
    ["providers_status", {}],
    ["media_help", {}],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.notEqual(result.isError, true, `${name}: ${text(result)}`);
    if (name === "overseerr_issue_comment") assert.match(text(result), /hello/);
  }
});
test("upstream failures return tool errors without killing the MCP session", async (t) => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(401);
    res.end("{}");
  });
  const client = await mcp(t, allConfig(f.url));
  for (const [name, args] of [
    ["tv_search", { query: "x" }],
    ["movie_search", { query: "x" }],
    ["request_list", {}],
    ["library_list", {}],
    ["downloads_history", {}],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, true, name);
    assert.match(text(result), /Authentication failed/);
  }
  assert.notEqual(
    (await client.callTool({ name: "providers_status", arguments: {} }))
      .isError,
    true,
  );
});
test("cross-service sync preview remains read-only for string false", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname === "/library/sections")
      res.end(
        '{"MediaContainer":{"Directory":[{"key":"1","title":"Movies","type":"movie"}]}}',
      );
    else if (req.url.pathname === "/library/sections/1/all")
      res.end(
        '{"MediaContainer":{"size":1,"Metadata":[{"ratingKey":"1","type":"movie","title":"Fixture","year":2020,"Guid":[{"id":"tmdb://22"}]}]}}',
      );
    else res.end("[]");
  });
  const client = await mcp(t, {
    plex: { url: f.url, token: "dummy" },
    radarr: { url: f.url, apiKey: "dummy" },
  });
  const result = await client.callTool({
    name: "library_sync",
    arguments: { type: "orphans", confirm: "false" },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.match(text(result), /dry-run/);
  assert.match(text(result), /Fixture/);
  assert.ok(f.calls.every((c) => c.method === "GET"));
});
test("compiled entrypoint initializes over stdio with Seerr configuration", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "arrs-stdio-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, "config.json");
  await writeFile(
    path,
    JSON.stringify({ seerr: { url: "http://127.0.0.1:1", apiKey: "dummy" } }),
  );
  // Supply only a small clean environment, never inherit real service credentials.
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve("dist/index.js")],
    // No cwd: on Windows a live child locks its working directory, so pointing
    // it at the temp dir makes the teardown rmdir fail with EBUSY. The server
    // reads config from the absolute CONFIG_PATH env, so cwd is unnecessary.
    env: { PATH: process.env.PATH, CONFIG_PATH: path },
    stderr: "pipe",
  });
  const client = new Client({ name: "stdio-test", version: "1" });
  t.after(() => client.close());
  await client.connect(transport);
  const result = await client.callTool({
    name: "providers_status",
    arguments: {},
  });
  assert.notEqual(result.isError, true);
  assert.match(text(result), /Seerr/);
  const tools = await client.listTools();
  assert.ok(tools.tools.some((t) => t.name === "request_list"));
  assert.ok(!tools.tools.some((t) => t.name === "movie_search"));
});

test("every registered tool survives upstream outages and leaves transport usable", async (t) => {
  // Block all external traffic, including TMDB's fixed public origin.
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("{}", { status: 401 }),
  );
  const client = await mcp(t, allConfig("http://fixture.invalid"));
  const { tools } = await client.listTools();
  function value(schema) {
    if (schema.default !== undefined) return schema.default;
    if (schema.anyOf) return value(schema.anyOf[0]);
    if (schema.enum) return schema.enum[0];
    if (schema.type === "boolean") return false;
    if (schema.type === "number" || schema.type === "integer")
      return Math.max(1, schema.minimum ?? 1);
    if (schema.type === "array") return [value(schema.items)];
    return "1";
  }
  for (const tool of tools) {
    const args = Object.fromEntries(
      (tool.inputSchema.required ?? []).map((key) => [
        key,
        value(tool.inputSchema.properties[key]),
      ]),
    );
    const result = await client.callTool({ name: tool.name, arguments: args });
    assert.ok(Array.isArray(result.content), tool.name);
    // Read-only status tools may intentionally aggregate provider errors.
    assert.ok(text(result).length > 0, tool.name);
  }
  assert.equal((await client.listTools()).tools.length, tools.length);
});

test("blocklisting cannot remove downloads without explicit confirmation", async (t) => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(204);
    res.end();
  });
  const client = await mcp(t, allConfig(f.url));
  for (const name of ["sonarr_blacklist", "radarr_blacklist"]) {
    for (const confirm of [undefined, false, "false"]) {
      const result = await client.callTool({
        name,
        arguments: {
          queue_id: 1,
          ...(confirm === undefined ? {} : { confirm }),
        },
      });
      assert.equal(result.isError, true, name);
    }
  }
  assert.equal(f.calls.length, 0);
});
test("sync does not cross-register 4K-managed movies in HD, even when confirmed", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname === "/library/sections")
      res.end(
        '{"MediaContainer":{"Directory":[{"key":"1","title":"4K Movies","type":"movie"}]}}',
      );
    else if (req.url.pathname === "/library/sections/1/all")
      res.end(
        '{"MediaContainer":{"size":1,"Metadata":[{"ratingKey":"1","title":"4K-only","year":2020,"Guid":[{"id":"tmdb://22"}]}]}}',
      );
    else if (req.url.pathname === "/4k/api/v3/movie")
      res.end('[{"id":2,"title":"4K-only","year":2020,"tmdbId":22}]');
    else res.end("[]");
  });
  const client = await mcp(t, {
    plex: { url: f.url, token: "dummy" },
    radarr: { url: f.url, apiKey: "dummy" },
    radarr4k: { url: f.url + "/4k", apiKey: "dummy" },
  });
  const result = await client.callTool({
    name: "library_sync",
    arguments: { type: "orphans", confirm: true },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.doesNotMatch(text(result), /4K-only/);
  assert.ok(f.calls.some((c) => c.url.pathname === "/4k/api/v3/movie"));
  assert.ok(f.calls.every((c) => c.method === "GET"));
});
test("explicit quality audit loads HD and 4K and reports both routing errors", async (t) => {
  const f = await fixture(t, (req, res) =>
    res.end(
      JSON.stringify([
        {
          id: 1,
          title: req.url.pathname.startsWith("/4k") ? "HD wrong" : "4K wrong",
          tmdbId: 1,
          hasFile: true,
          movieFile: {
            mediaInfo: {
              resolution: req.url.pathname.startsWith("/4k")
                ? "1920x1080"
                : "3840x2160",
            },
          },
        },
      ]),
    ),
  );
  const client = await mcp(t, {
    radarr: { url: f.url, apiKey: "dummy" },
    radarr4k: { url: f.url + "/4k", apiKey: "dummy" },
  });
  const result = await client.callTool({
    name: "library_audit",
    arguments: { check: "quality" },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.match(text(result), /4K wrong/);
  assert.match(text(result), /HD wrong/);
});

test("Seerr displays failed/completed requests and configured unexhausted quotas accurately", async (t) => {
  const f = await fixture(t, (req, res) => {
    const path = req.url.pathname;
    if (path === "/api/v1/request")
      res.end(
        JSON.stringify({
          pageInfo: { results: 2 },
          results: [4, 5].map((status) => ({
            id: status,
            status,
            type: "movie",
            media: { tmdbId: 1 },
            requestedBy: { displayName: "Test" },
            createdAt: "2020-01-01",
          })),
        }),
      );
    else if (path === "/api/v1/movie/1") res.end('{"title":"Fixture"}');
    else if (path === "/api/v1/user/1") res.end('{"displayName":"Test"}');
    else
      res.end(
        '{"movie":{"limit":10,"used":2,"remaining":8,"restricted":false},"tv":{"used":0,"restricted":false}}',
      );
  });
  const client = await mcp(t, { overseerr: { url: f.url, apiKey: "dummy" } });
  const requests = await client.callTool({
    name: "request_list",
    arguments: {},
  });
  assert.notEqual(requests.isError, true, text(requests));
  assert.match(text(requests), /Failed/);
  assert.match(text(requests), /Completed/);
  const quota = await client.callTool({
    name: "overseerr_user_quota",
    arguments: { user_id: 1 },
  });
  assert.match(text(quota), /Movies: 8\/10 remaining/);
  assert.match(text(quota), /TV Shows: Unlimited/);
});
test("ended-only cleanup excludes fully watched continuing shows using Sonarr status", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname === "/library/sections")
      res.end(
        '{"MediaContainer":{"Directory":[{"key":"1","title":"TV","type":"show"}]}}',
      );
    else if (req.url.pathname === "/api/v3/series")
      res.end(
        '[{"id":1,"tvdbId":11,"title":"Continuing fixture","year":2020,"status":"continuing"},{"id":2,"tvdbId":12,"title":"Ended fixture","year":2020,"status":"ended"}]',
      );
    else
      res.end(
        JSON.stringify({
          MediaContainer: {
            size: 2,
            Metadata: [11, 12].map((id) => ({
              ratingKey: String(id),
              title: id === 11 ? "Continuing fixture" : "Ended fixture",
              year: 2020,
              type: "show",
              viewCount: 1,
              viewedLeafCount: 10,
              leafCount: 10,
              lastViewedAt: 1000,
              addedAt: 1,
              Guid: [{ id: `tvdb://${id}` }],
            })),
          },
        }),
      );
  });
  const client = await mcp(t, {
    plex: { url: f.url, token: "dummy" },
    sonarr: { url: f.url, apiKey: "dummy" },
  });
  const result = await client.callTool({
    name: "plex_watched_old",
    arguments: { ended_only: true, days: 1 },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.match(text(result), /Ended fixture/);
  assert.doesNotMatch(text(result), /Continuing fixture/);
});
test("4K inventory outage aborts orphan sync before any mutation", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname.startsWith("/4k")) {
      res.writeHead(503);
      res.end("{}");
    } else res.end("[]");
  });
  const client = await mcp(t, {
    plex: { url: f.url, token: "dummy" },
    radarr: { url: f.url, apiKey: "dummy" },
    radarr4k: { url: f.url + "/4k", apiKey: "dummy" },
  });
  const result = await client.callTool({
    name: "library_sync",
    arguments: { type: "orphans", confirm: true },
  });
  assert.equal(result.isError, true);
  assert.ok(f.calls.every((c) => c.method === "GET"));
});
test("explicit quality audit also works with only HD configured", async (t) => {
  const f = await fixture(t, (_req, res) =>
    res.end(
      '[{"id":1,"title":"Misrouted","hasFile":true,"movieFile":{"mediaInfo":{"resolution":"3840x2160"}}}]',
    ),
  );
  const client = await mcp(t, { radarr: { url: f.url, apiKey: "dummy" } });
  const result = await client.callTool({
    name: "library_audit",
    arguments: { check: "quality" },
  });
  assert.match(text(result), /Misrouted/);
});

test("TMDB library matching ignores wrong same-year hits in localized Plex hubs", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    const path = new URL(url).pathname;
    if (path === "/3/collection/1")
      return Response.json({
        id: 1,
        name: "Fixture collection",
        parts: [
          {
            id: 11,
            title: "Correct Movie",
            release_date: "2020-01-01",
            vote_average: 7,
          },
        ],
      });
    if (path === "/hubs/search")
      return Response.json({
        MediaContainer: {
          Hub: [
            {
              title: "Películas",
              Metadata: [
                {
                  ratingKey: "1",
                  title: "Wrong Movie",
                  year: 2020,
                  type: "movie",
                  Guid: [{ id: "tmdb://12" }],
                },
              ],
            },
          ],
        },
      });
    return Response.json({}, { status: 404 });
  });
  const client = await mcp(t, {
    tmdb: { apiKey: "dummy" },
    plex: { url: "http://fixture.invalid", token: "dummy" },
  });
  const result = await client.callTool({
    name: "collection_missing",
    arguments: { collection_id: 1 },
  });
  assert.notEqual(result.isError, true, text(result));
  assert.match(text(result), /Correct Movie/);
  assert.doesNotMatch(text(result), /collection is complete/i);
});
