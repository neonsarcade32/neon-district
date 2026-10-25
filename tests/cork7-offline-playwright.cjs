'use strict';

// Browser-level offline smoke test: load Cork7 online, wait for the service
// worker and core shell cache, then simulate a disconnected browser context.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.ARCADE_TEST_URL || 'http://127.0.0.1:8080';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--use-gl=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto(base + '/cork7.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.equal(response.status(), 200, 'Cork7 page must load online');
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, { timeout: 20000 });
    await page.waitForFunction(async () => {
      const names = (await caches.keys()).filter(n => n.startsWith('nd-cork7-static-'));
      if (!names.length) return false;
      const all = [];
      for (const name of names) all.push(...await (await caches.open(name)).keys());
      const paths = all.map(r => new URL(r.url).pathname);
      return paths.some(p => p.endsWith('/cork7.html')) &&
        paths.some(p => p.endsWith('/cork7-standalone.js')) &&
        paths.some(p => p.endsWith('/game-client-ND-standalone.js'));
    }, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await context.setOffline(true);
    const offlineResponse = await page.goto(base + '/cork7.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    assert.equal(offlineResponse.status(), 200, 'Cork7 navigation must work offline after warm load');
    assert.equal(await page.locator('#cork7-root').count(), 1, 'Cork7 game root must exist offline');
    const engine = await page.evaluate(async () => {
      const url = new URL('cork7-assets/_next/static/chunks/game-client-ND-standalone.js', location.href);
      const response = await fetch(url.href);
      return { status: response.status, bytes: (await response.text()).length };
    });
    assert.equal(engine.status, 200, 'local game engine must be served offline');
    assert.ok(engine.bytes > 10000, 'local game engine must contain the game bundle');
    assert.deepEqual(errors, [], 'no uncaught page errors during offline reload');
    console.log('PASS Cork7 browser offline smoke: cached page and engine served with network disabled.');
  } finally {
    await context.setOffline(false).catch(() => {});
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
