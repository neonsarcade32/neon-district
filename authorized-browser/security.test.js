import test from "node:test";
import assert from "node:assert/strict";

test("deployment must fail closed without required secrets and allowlist", () => {
  const src = process.env.SERVICE_SOURCE || "";
  assert.ok(src.includes("BROWSER_API_TOKEN"));
  assert.ok(src.includes("ALLOWED_ORIGIN"));
  assert.ok(src.includes("ALLOWED_HOSTS"));
  assert.ok(src.includes("process.exit(1)"));
});
