'use strict';

const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const baseUrl = process.env.NEON_PROXY_URL ||
  'https://neonsarcade32.github.io/neon-district/neon-proxy.html';
const failures = [];
const report = (name, ok, detail = '') => {
  console.log(JSON.stringify({ test: name, result: ok ? 'PASS' : 'FAIL', detail }));
  if (!ok) failures.push(name);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    const response = await page.goto(baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'e2e=' + Date.now(),
      { waitUntil: 'domcontentloaded', timeout: 30000 });
    report('proxy page loads over HTTPS', !!response && response.status() === 200,
      response ? 'HTTP ' + response.status() : 'No HTTP response');
    assert.equal(await page.title(), 'Neon Proxy · Neon District');

    await page.locator('#serverUrl').fill('https://user:password@example.com');
    await page.locator('#connectForm button[type="submit"]').click();
    const invalidStatus = await page.locator('#status').innerText();
    report('rejects embedded credentials', invalidStatus.includes('Invalid address'),
      invalidStatus.replace(/\s+/g, ' ').trim());

    await page.locator('#serverUrl').fill('https://127.0.0.1:1');
    await page.locator('#connectForm button[type="submit"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('#status')?.innerText || '';
      return text.includes('Connection could not be verified') || text.includes('Reachability timed out');
    }, { timeout: 15000 });
    const connectionStatus = await page.locator('#status').innerText();
    report('reports a failed connection distinctly', /Connection could not be verified|Reachability timed out/.test(connectionStatus),
      connectionStatus.replace(/\s+/g, ' ').trim());

    await page.locator('#disconnectButton').click();
    const disconnectStatus = await page.locator('#status').innerText();
    const saved = await page.evaluate(() => localStorage.getItem('neon_proxy_server_url'));
    report('disconnect clears saved server address', saved === null && disconnectStatus.includes('Disconnected'),
      disconnectStatus.replace(/\s+/g, ' ').trim());

    await page.goto(new URL('index.html', baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    report('navigates to Neon District home page', (await page.title()).length > 0 && page.url().includes('index.html'));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    report('can navigate back to proxy page', (await page.title()) === 'Neon Proxy · Neon District');

    report('no uncaught page errors', pageErrors.length === 0, pageErrors.join('; ') || 'none');
  } catch (error) {
    report('test execution', false, error.message);
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error('Failed tests: ' + failures.join(', '));
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
