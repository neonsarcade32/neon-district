import express from "express";
import { chromium } from "playwright";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const PORT = Number(process.env.PORT || 8080);
const TOKEN = process.env.BROWSER_API_TOKEN || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";
const ALLOWED_HOSTS = new Set((process.env.ALLOWED_HOSTS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
const MAX_SESSIONS = Math.max(1, Math.min(5, Number(process.env.MAX_SESSIONS || 2)));
const SESSION_TTL_MS = Math.max(60_000, Math.min(30 * 60_000, Number(process.env.SESSION_TTL_MS || 10 * 60_000)));
const sessions = new Map();
let browser;

if (TOKEN.length < 32 || ALLOWED_ORIGIN.length < 8 || ALLOWED_HOSTS.size === 0) {
  console.error("Refusing to start: set BROWSER_API_TOKEN (32+ chars), ALLOWED_ORIGIN, and exact ALLOWED_HOSTS.");
  process.exit(1);
}

function safeEqual(a, b) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  if (req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) return res.status(403).json({ error: "origin_not_allowed" });
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    return res.status(204).end();
  }
  next();
});
function auth(req, res, next) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ") || !safeEqual(value.slice(7), TOKEN)) return res.status(401).json({ error: "unauthorized" });
  next();
}
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "authorized-browser", runtime: browser ? "ready" : "starting", sessions: sessions.size, allowlistConfigured: ALLOWED_HOSTS.size > 0 }));
app.use("/sessions", auth);

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 ||
      (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      (p[0] === 192 && p[1] === 0 && p[2] === 0) || (p[0] === 198 && (p[1] === 18 || p[1] === 19));
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return x === "::" || x === "::1" || x.startsWith("fc") || x.startsWith("fd") ||
      x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb") ||
      x.startsWith("::ffff:127.") || x.startsWith("::ffff:10.") || x.startsWith("::ffff:192.168.");
  }
  return true;
}
async function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("invalid_url"); }
  if (u.protocol !== "https:" || u.username || u.password || u.port) throw new Error("https_only_no_credentials_or_custom_ports");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!ALLOWED_HOSTS.has(host) || net.isIP(host)) throw new Error("host_not_allowlisted");
  let records;
  try { records = await lookup(host, { all: true, verbatim: true }); } catch { throw new Error("host_dns_failed"); }
  if (!records.length || records.some(r => isPrivateAddress(r.address))) throw new Error("host_resolves_to_non_public_address");
  return u.toString();
}
async function securePage(page) {
  await page.route("**/*", async route => {
    try {
      const u = new URL(route.request().url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      await validateUrl(u.toString());
      return route.continue();
    } catch {
      return route.abort("blockedbyclient");
    }
  });
}
function getSession(id) {
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.lastUsed > SESSION_TTL_MS) {
    s.context.close().catch(() => {});
    sessions.delete(id);
    return null;
  }
  s.lastUsed = Date.now();
  return s;
}
app.post("/sessions", async (_req, res) => {
  if (sessions.size >= MAX_SESSIONS) return res.status(429).json({ error: "session_limit_reached" });
  try {
    const context = await browser.newContext({ acceptDownloads: false, serviceWorkers: "block" });
    const page = await context.newPage();
    await securePage(page);
    const id = randomBytes(24).toString("base64url");
    sessions.set(id, { context, page, lastUsed: Date.now() });
    res.status(201).json({ id, expiresInMs: SESSION_TTL_MS });
  } catch {
    res.status(500).json({ error: "session_create_failed" });
  }
});
app.post("/sessions/:id/navigate", async (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: "session_not_found_or_expired" });
  let url;
  try { url = await validateUrl(String(req.body?.url || "")); }
  catch (e) { return res.status(400).json({ error: e.message || "url_rejected" }); }
  try {
    const response = await s.page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const finalUrl = s.page.url();
    await validateUrl(finalUrl);
    return res.json({ ok: true, status: response?.status() ?? null, url: finalUrl, title: await s.page.title() });
  } catch {
    return res.status(502).json({ error: "navigation_failed_or_redirect_blocked" });
  }
});
app.get("/sessions/:id/screenshot", async (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: "session_not_found_or_expired" });
  try {
    const png = await s.page.screenshot({ type: "png", fullPage: false, timeout: 8000 });
    res.type("png").send(png);
  } catch { res.status(502).json({ error: "screenshot_failed" }); }
});
app.delete("/sessions/:id", async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(204).end();
  sessions.delete(req.params.id);
  await s.context.close().catch(() => {});
  res.status(204).end();
});
const cleanup = setInterval(() => {
  for (const [id, s] of sessions) if (Date.now() - s.lastUsed > SESSION_TTL_MS) {
    sessions.delete(id); s.context.close().catch(() => {});
  }
}, 30_000);
cleanup.unref();

try {
  browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  const server = app.listen(PORT, "0.0.0.0", () => console.log(`Authorized browser API listening on ${PORT}`));
  async function shutdown() {
    clearInterval(cleanup);
    server.close();
    await Promise.all([...sessions.values()].map(s => s.context.close().catch(() => {})));
    await browser?.close().catch(() => {});
    process.exit(0);
  }
  process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
} catch (e) {
  console.error("Browser runtime failed to start:", e.message);
  process.exit(1);
}
