const { test, expect } = require('@playwright/test');

test('loads the rink and starts a match', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveTitle(/Pocket Hockey/i);
  await expect(page.locator('#rink')).toBeVisible();
  await expect(page.locator('#state')).toHaveText('Title screen');
  await page.getByRole('button', { name: /Press P \/ Start/i }).click();
  await expect(page.locator('#state')).toHaveText('Match in progress');
  await expect(page.locator('#card')).not.toHaveClass(/show/);
});

test('pause and resume work from the toolbar', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: /Press P \/ Start/i }).click();
  await page.getByRole('button', { name: /Pause/i }).click();
  await expect(page.locator('#state')).toHaveText('Paused');
  await expect(page.locator('#cardTitle')).toHaveText('PAUSED');
  await page.getByRole('button', { name: /Resume/i }).click();
  await expect(page.locator('#state')).toHaveText('Match in progress');
  await expect(page.locator('#card')).not.toHaveClass(/show/);
});

test('P toggles pause and resume, and replay starts a fresh match', async ({ page }) => {
  await page.goto('/index.html');
  await page.keyboard.press('p');
  await expect(page.locator('#state')).toHaveText('Match in progress');
  await page.keyboard.press('p');
  await expect(page.locator('#state')).toHaveText('Paused');
  await page.keyboard.press('p');
  await expect(page.locator('#state')).toHaveText('Match in progress');
  await page.getByRole('button', { name: /Restart/i }).click();
  await expect(page.locator('#state')).toHaveText('Match in progress');
});

test('title button returns to the title screen', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: /Press P \/ Start/i }).click();
  await page.getByRole('button', { name: /Title/i }).click();
  await expect(page.locator('#state')).toHaveText('Title screen');
  await expect(page.locator('#cardTitle')).toHaveText('POCKET HOCKEY');
  await expect(page.locator('#card')).toHaveClass(/show/);
});

test('canvas remains usable on a phone-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/index.html');
  const canvas = page.locator('#rink');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(375);
  expect(box.height).toBeGreaterThan(250);
});
