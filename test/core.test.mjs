import test from "node:test";
import assert from "node:assert/strict";
import { HttpClient } from "../dist/shared/http.js";
import { ApiError, NetworkError } from "../dist/shared/errors.js";
import { booleanParam } from "../dist/shared/params.js";
import { PlexClient } from "../dist/services/plex/client.js";
import { RadarrClient } from "../dist/services/radarr/client.js";
import { SonarrClient } from "../dist/services/sonarr/client.js";
import { OverseerrClient } from "../dist/services/overseerr/client.js";
import { SabnzbdClient } from "../dist/services/sabnzbd/client.js";
import {
  normalizeTitle,
  buildMovieIndex,
  matchMovie,
  extractPlexIds,
} from "../dist/shared/matching.js";
import { fixture } from "./helpers.mjs";

test("booleans reject ambiguous truthy values and preserve false", () => {
  for (const value of [false, "false"])
    assert.equal(booleanParam().parse(value), false);
  for (const value of [true, "true"])
    assert.equal(booleanParam().parse(value), true);
  for (const value of ["", "no", "0", 0, 1, null, [], {}])
    assert.equal(booleanParam().safeParse(value).success, false);
});
test("HTTP handles JSON, falsy request bodies, empty deletes, and classified errors", async (t) => {
  const f = await fixture(t, (req, res) => {
    if (req.url.pathname === "/denied") {
      res.writeHead(401);
      res.end("secret error");
    } else if (req.method === "DELETE") {
      res.writeHead(204);
      res.end();
    } else res.end(JSON.stringify({ body: req.body ?? null }));
  });
  const client = new HttpClient({ baseUrl: f.url, serviceName: "Test" });
  assert.deepEqual(await client.post("/", false), { body: false });
  assert.equal(await client.delete("/"), undefined);
  await assert.rejects(
    client.get("/denied"),
    (e) =>
      e instanceof ApiError &&
      e.statusCode === 401 &&
      !e.toUserMessage().includes("secret"),
  );
});
test("HTTP deadline includes a response body stalled after headers", async (t) => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200);
    res.flushHeaders();
    res.write("{");
  });
  const client = new HttpClient({ baseUrl: f.url, timeout: 50 });
  await assert.rejects(
    client.get("/"),
    (e) => e instanceof NetworkError && /timed out/.test(e.message),
  );
});
test("service paths retain reverse-proxy prefixes and normalize trailing slashes", async (t) => {
  const f = await fixture(t, (_req, res) => res.end("[]"));
  const config = { url: f.url + "/proxy/", apiKey: "test-key" };
  await new SonarrClient(config).getAllSeries();
  await new RadarrClient(config).getAllMovies();
  await new OverseerrClient(config).getRequests();
  assert.deepEqual(
    f.calls.map((c) => c.url.pathname),
    ["/proxy/api/v3/series", "/proxy/api/v3/movie", "/proxy/api/v1/request"],
  );
  assert.ok(f.calls.every((c) => c.headers["x-api-key"] === "test-key"));
});
test("SAB rejected operations are errors, not false-positive success", async (t) => {
  const f = await fixture(t, (_req, res) => res.end('{"status":false}'));
  await assert.rejects(
    new SabnzbdClient({ url: f.url, apiKey: "dummy" }).pause(),
    ApiError,
  );
});
test("Plex and Radarr distinguish not-found from authentication failure", async (t) => {
  let status = 401;
  const f = await fixture(t, (_req, res) => {
    res.writeHead(status);
    res.end("{}");
  });
  const plex = new PlexClient({ url: f.url, token: "dummy" });
  const radarr = new RadarrClient({ url: f.url, apiKey: "dummy" });
  await assert.rejects(plex.getItem("1"), ApiError);
  await assert.rejects(plex.getCollections(), ApiError);
  await assert.rejects(radarr.getDiscovery(), ApiError);
  status = 404;
  assert.equal(await plex.getItem("1"), null);
  assert.deepEqual(await radarr.getDiscovery(), []);
});
test("Plex full scans paginate using returned sizes and request GUIDs", async (t) => {
  const f = await fixture(t, (req, res) => {
    const start = Number(req.url.searchParams.get("X-Plex-Container-Start"));
    assert.equal(req.url.searchParams.get("includeGuids"), "1");
    res.end(
      JSON.stringify({
        MediaContainer: {
          totalSize: 3,
          size: start === 0 ? 2 : 1,
          Metadata:
            start === 0
              ? [{ ratingKey: "1" }, { ratingKey: "2" }]
              : [{ ratingKey: "3" }],
        },
      }),
    );
  });
  const result = await new PlexClient({
    url: f.url,
    token: "dummy",
  }).getAllLibraryItems("1");
  assert.equal(result.items.length, 3);
  assert.equal(f.calls[1].url.searchParams.get("X-Plex-Container-Start"), "2");
});
test("matching preserves Unicode and exact-year precedence with GUID priority", () => {
  assert.equal(normalizeTitle("The Theater"), "theater");
  assert.notEqual(normalizeTitle("東京"), normalizeTitle("京都"));
  const movies = [
    { title: "Example", year: 2000, id: 1, tmdbId: 10 },
    { title: "Example", year: 2001, id: 2, tmdbId: 11 },
  ];
  assert.equal(
    matchMovie({ title: "Example", year: 2000 }, buildMovieIndex(movies)).item
      .id,
    1,
  );
  assert.equal(
    matchMovie({ title: "Other", tmdbId: 11 }, buildMovieIndex(movies)).item.id,
    2,
  );
  assert.deepEqual(
    extractPlexIds(undefined, [{ id: "tmdb://10" }, { id: "imdb://tt123" }]),
    { tmdbId: 10, imdbId: "tt123" },
  );
});

test("Radarr rename submits RenameMovie with movieIds (not incomplete RenameFiles)", async (t) => {
  const f = await fixture(t, (_req, res) => res.end('{"id":1}'));
  await new RadarrClient({ url: f.url, apiKey: "dummy" }).renameMovie(42);
  assert.deepEqual(f.calls[0].body, { name: "RenameMovie", movieIds: [42] });
});
test("Plex duplicates include multiple media versions under a single ratingKey", async (t) => {
  const f = await fixture(t, (req, res) => {
    assert.equal(req.url.searchParams.get("duplicate"), "1");
    res.end(
      JSON.stringify({
        MediaContainer: {
          size: 1,
          Metadata: [
            {
              ratingKey: "1",
              title: "Fixture",
              year: 2020,
              Media: [
                { id: 1, videoResolution: "1080", Part: [{ size: 100 }] },
                { id: 2, videoResolution: "4k", Part: [{ size: 200 }] },
              ],
            },
          ],
        },
      }),
    );
  });
  const result = await new PlexClient({
    url: f.url,
    token: "dummy",
  }).getDuplicates("1");
  assert.equal(result.length, 1);
  assert.equal(result[0].duplicateCount, 2);
  assert.equal(result[0].totalSizeBytes, 300);
  assert.equal(result[0].items[0].sizeBytes, 200);
});
test("Plex optimization errors are surfaced without replaying a mutation", async (t) => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(503);
    res.end("{}");
  });
  await assert.rejects(
    new PlexClient({ url: f.url, token: "dummy" }).optimizeDatabase(),
    ApiError,
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].method, "PUT");
});
test("Seerr declined requests are locally filtered across all pages", async (t) => {
  const f = await fixture(t, (req, res) => {
    assert.equal(req.url.searchParams.has("filter"), false);
    const skip = Number(req.url.searchParams.get("skip"));
    res.end(
      JSON.stringify({
        pageInfo: { results: 3 },
        results:
          skip === 0
            ? [
                { id: 1, status: 1 },
                { id: 2, status: 3 },
              ]
            : [{ id: 3, status: 3 }],
      }),
    );
  });
  const result = await new OverseerrClient({
    url: f.url,
    apiKey: "dummy",
  }).getRequests("declined", 1, 1);
  assert.deepEqual(result.results, [{ id: 3, status: 3 }]);
  assert.equal(result.pageInfo.results, 2);
});
test("Seerr trending uses the trending endpoint and excludes mismatched legacy types", async (t) => {
  const f = await fixture(t, (req, res) => {
    assert.equal(req.url.pathname, "/api/v1/discover/trending");
    assert.equal(req.url.searchParams.get("mediaType"), "tv");
    res.end(
      '{"results":[{"id":1,"mediaType":"tv"},{"id":2,"mediaType":"movie"},{"id":3,"mediaType":"person"}]}',
    );
  });
  const result = await new OverseerrClient({
    url: f.url,
    apiKey: "dummy",
  }).getTrending("tv");
  assert.deepEqual(result.results, [{ id: 1, mediaType: "tv" }]);
});

test("HTTP does not forward service credentials to a redirect target", async (t) => {
  const target = await fixture(t, (_req, res) => res.end("{}"));
  const origin = await fixture(t, (_req, res) => {
    res.writeHead(302, { Location: target.url });
    res.end();
  });
  const client = new HttpClient({
    baseUrl: origin.url,
    headers: { "X-Api-Key": "fixture-secret" },
  });
  await assert.rejects(client.get("/"), NetworkError);
  assert.equal(target.calls.length, 0);
});
test("invalid JSON errors do not expose response bodies", async (t) => {
  const f = await fixture(t, (_req, res) =>
    res.end("credential=fixture-secret"),
  );
  await assert.rejects(
    new HttpClient({ baseUrl: f.url }).get("/"),
    (e) => !e.toUserMessage().includes("fixture-secret"),
  );
});
