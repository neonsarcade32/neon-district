import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "server.js");

test("service refuses to start without authentication and destination allowlist", () => {
  const env = { ...process.env };
  delete env.BROWSER_API_TOKEN;
  delete env.ALLOWED_ORIGIN;
  delete env.ALLOWED_HOSTS;
  const result = spawnSync(process.execPath, [serverPath], { env, encoding: "utf8", timeout: 5000 });
  assert.equal(result.status, 1, "service must exit instead of starting with insecure defaults");
  assert.match(result.stderr, /Refusing to start/);
});
