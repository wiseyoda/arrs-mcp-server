import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../dist/config.js";

function configTest(t, config, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), "arrs-config-"));
  const original = { ...process.env };
  for (const key of Object.keys(process.env))
    if (
      /^(SONARR|RADARR|RADARR4K|PLEX|SABNZBD|OVERSEERR|SEERR|TMDB|CONFIG_PATH)/.test(
        key,
      )
    )
      delete process.env[key];
  const path = join(dir, "config.json");
  writeFileSync(
    path,
    typeof config === "string" ? config : JSON.stringify(config),
  );
  Object.assign(process.env, { CONFIG_PATH: path }, env);
  t.after(() => {
    process.env = original;
    rmSync(dir, { recursive: true, force: true });
  });
}
test("Seerr aliases normalize to legacy provider and env fields win individually", (t) => {
  configTest(
    t,
    {
      seerr: { url: "http://file/seerr/", apiKey: "file" },
      overseerr: { url: "http://old", apiKey: "old" },
    },
    { SEERR_API_KEY: "env" },
  );
  assert.deepEqual(loadConfig().overseerr, {
    url: "http://file/seerr",
    apiKey: "env",
  });
});
test("legacy env settings remain compatible", (t) => {
  configTest(
    t,
    {},
    { OVERSEERR_URL: "http://legacy/", OVERSEERR_API_KEY: "key" },
  );
  assert.deepEqual(loadConfig().overseerr, {
    url: "http://legacy",
    apiKey: "key",
  });
});
test("Seerr env wins when both environment aliases are present", (t) => {
  configTest(
    t,
    {},
    {
      SEERR_URL: "http://new",
      SEERR_API_KEY: "new",
      OVERSEERR_URL: "http://old",
      OVERSEERR_API_KEY: "old",
    },
  );
  assert.deepEqual(loadConfig().overseerr, {
    url: "http://new",
    apiKey: "new",
  });
});
for (const [label, config] of [
  ["partial", { radarr: { url: "http://a" } }],
  ["invalid URL", { sonarr: { url: "ftp://a", apiKey: "secret" } }],
  ["wrong type", { plex: "secret" }],
  ["array", []],
  ["malformed", '{"secret":"dont-print-me",'],
  ["empty", {}],
]) {
  test(`invalid config fails safely: ${label}`, (t) => {
    configTest(t, config);
    assert.throws(
      () => loadConfig(),
      (e) =>
        !e.message.includes("dont-print-me") && !e.message.includes("ftp://"),
    );
  });
}
