'use strict';

// Browser-level offline smoke test: load Cork7 online, wait for the service
// worker and core shell cache, then simulate a disconnected browser context.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.ARCADE_TEST_URL || 'http://127.0.0.1:8080';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--use-gl=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  let page = await context.newPage();
  const errors = [];
  const offlineFailures = [];
  let offlineMode = false;
  const attachDiagnostics = target => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('requestfailed', request => {
      if (offlineMode && request.url().startsWith(base)) {
        offlineFailures.push({ url: request.url(), failure: request.failure()?.errorText || 'request failed' });
      }
    });
    target.on('response', response => {
      if (offlineMode && response.url().startsWith(base) && response.status() >= 400) {
        offlineFailures.push({ url: response.url(), failure: 'HTTP ' + response.status() });
      }
    });
  };
  attachDiagnostics(page);
  try {
    const response = await page.goto(base + '/cork7-standalone.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.equal(response.status(), 200, 'Cork7 page must load online');
    // First visit installs the worker; a reload lets the newly installed worker control this page.
    await page.waitForFunction(() => {
      return !!(window.__ndCork7Offline && window.__ndCork7Offline.registered);
    }, null, { timeout: 30000 }).catch(async error => {
      const state = await page.evaluate(() => ({
        secure: window.isSecureContext,
        swSupported: 'serviceWorker' in navigator,
        registration: window.__ndCork7Offline || null,
        workerUrl: new URL('cork7-offline-sw.js', location.href).href
      }));
      throw new Error('Cork7 service worker did not register: ' + JSON.stringify(state) + '; ' + error.message);
    });
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.getRegistration(location.href);
      return !!reg && !!reg.active;
    }, null, { timeout: 30000 });
    // A fresh document is the most reliable way to test a newly activated worker:
    // the initial document can remain uncontrolled even after registration.activate().
    await page.close();
    page = await context.newPage();
    attachDiagnostics(page);
    await page.goto(base + '/cork7.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(async error => {
      const state = await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration('/');
        return {
          controller: navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : null,
          ready: (await navigator.serviceWorker.ready).active?.state || null,
          registration: reg ? {
            scope: reg.scope,
            active: reg.active ? {scriptURL: reg.active.scriptURL, state: reg.active.state} : null,
            installing: reg.installing ? reg.installing.state : null,
            waiting: reg.waiting ? reg.waiting.state : null
          } : null
        };
      });
      throw new Error('Service worker active but not controlling after reload: ' + JSON.stringify(state) + '; ' + error.message);
    });
    await page.waitForFunction(async () => {
      const names = (await caches.keys()).filter(n => n.startsWith('nd-cork7-static-'));
      if (!names.length) return false;
      const all = [];
      for (const name of names) all.push(...await (await caches.open(name)).keys());
      const paths = all.map(r => new URL(r.url).pathname);
      return paths.some(p => p.endsWith('/cork7-standalone.html')) &&
        paths.some(p => p.endsWith('/cork7-standalone.js')) &&
        paths.some(p => p.endsWith('/game-client-ND-standalone.js'));
    }, { timeout: 30000 });
    await page.waitForTimeout(1200);
    offlineMode = true;
    await context.setOffline(true);
    const offlineResponse = await page.goto(base + '/cork7.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    assert.equal(offlineResponse.status(), 200, 'Cork7 standalone navigation must work offline after warm load');
    assert.equal(await page.locator('#cork7-root').count(), 1, 'Cork7 game root must exist offline');
    const engine = await page.evaluate(async () => {
      const url = new URL('cork7-assets/_next/static/chunks/game-client-ND-standalone.js', location.href);
      const response = await fetch(url.href);
      return { status: response.status, bytes: (await response.text()).length };
    });
    assert.equal(engine.status, 200, 'local game engine must be served offline');
    assert.ok(engine.bytes > 10000, 'local game engine must contain the game bundle');
    assert.deepEqual(errors, [], 'no uncaught page errors during offline reload');
    // Do not equate a cached shell/engine with an offline-ready game: every
    // same-origin request made by the offline boot must succeed from cache.
    const failedOfflineRequests = [...new Map(offlineFailures.map(item => [item.url + '|' + item.failure, item])).values()];
    assert.deepEqual(failedOfflineRequests, [], 'all same-origin requests during offline boot must succeed: ' + JSON.stringify(failedOfflineRequests, null, 2));
    const runtime = await page.evaluate(() => ({
      rootText: document.querySelector('#cork7-root')?.innerText?.slice(0, 300) || '',
      errorBanner: document.querySelector('#__next_error__')?.innerText || null,
      startupStatus: document.querySelector('#nd-cork7-startup-status')?.innerText || null,
      serviceWorker: navigator.serviceWorker.controller?.scriptURL || null
    }));
    assert.equal(runtime.errorBanner, null, 'game must not show the Cork7 startup error banner');
    assert.ok(!/could not start|failed to initialize|loading interrupted/i.test(runtime.rootText), 'game root must not display startup failure: ' + JSON.stringify(runtime));
    await page.waitForSelector('.bc-shell.bc-ready', { timeout: 90000 });
    const readyState = await page.evaluate(() => ({
      ready: !!document.querySelector('.bc-shell.bc-ready'),
      canvas: !!document.querySelector('.world-canvas canvas'),
      bodyText: document.body.innerText.slice(0, 1000)
    }));
    assert.ok(readyState.ready, 'offline game must reach its ready mountain-selection screen: ' + JSON.stringify(readyState));
    const soloRide = page.getByRole('button', { name: /RIDE SOLO/i }).first();
    await soloRide.waitFor({ state: 'visible', timeout: 15000 });
    await soloRide.click();
    await page.waitForTimeout(2500);
    const runState = await page.evaluate(() => ({
      ready: !!document.querySelector('.bc-shell.bc-ready'),
      loading: !!document.querySelector('.bc-shell.bc-loading'),
      canvas: !!document.querySelector('.world-canvas canvas'),
      fatal: document.querySelector('#nd-cork7-fatal')?.innerText || document.querySelector('#__next_error__')?.innerText || null,
      text: document.body.innerText.slice(0, 1200)
    }));
    assert.ok(!runState.fatal, 'offline solo run produced a fatal error: ' + JSON.stringify(runState));
    assert.ok(runState.canvas, 'offline solo run must render the 3D canvas: ' + JSON.stringify(runState));
    console.log('PASS Cork7 offline solo-start test: ready screen and RIDE SOLO action succeeded with network disabled.');
  } finally {
    await context.setOffline(false).catch(() => {});
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
