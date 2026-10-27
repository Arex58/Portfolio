const { test, expect } = require('@playwright/test');

test('startup can be skipped, cancelled, and repeated without starting music', async ({ page }) => {
  await page.goto('./');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'booting');
  await expect(page.locator('#monitorLive')).toHaveAttribute('inert', '');
  await expect(page.locator('#skipBoot')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'on');
  await expect(page.locator('#homeTitle')).toBeFocused();
  await expect(page.locator('#backgroundMusic')).toHaveJSProperty('paused', true);
  await page.locator('#powerToggle').click();
  await page.locator('#powerToggle').click();
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await page.waitForTimeout(1800);
  await expect(page.locator('#monitorLive')).toHaveAttribute('inert', '');
  await expect(page.locator('#bootScreen')).toBeHidden();
});

test('Smokey reacts to keyboard pets and has a rare tongue-out greeting', async ({ page }) => {
  await page.goto('./');
  const cat = page.getByRole('button', { name: 'Pet Smokey, my fluffy gray cat' });
  await cat.focus();
  await page.keyboard.press('Enter');
  await expect(cat).toHaveAttribute('data-state', 'pet');
  await expect(page.locator('#smokeyBubble')).not.toBeEmpty();
  for (let i = 0; i < 10; i++) await page.keyboard.press('Enter');
  await expect(cat).toHaveAttribute('data-state', 'blep');
  await expect(page.locator('#smokeyBubble')).toHaveText('…blep.');
  const screen = await page.locator('#monitorScreen').boundingBox();
  const catBounds = await cat.boundingBox();
  expect(catBounds.y).toBeGreaterThan(screen.y + screen.height);
});

test('room motion pauses, resumes, and respects reduced motion', async ({ page }) => {
  await page.goto('./');
  const pixels = () => page.locator('#cityCanvas').evaluate(el => el.toDataURL());
  await page.locator('#motionToggle').click();
  const paused = await pixels();
  await page.waitForTimeout(300);
  expect(await pixels()).toBe(paused);
  await page.locator('#motionToggle').click();
  await page.waitForTimeout(300);
  expect(await pixels()).not.toBe(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#motionToggle')).toBeDisabled();
  const reduced = await pixels();
  await page.waitForTimeout(300);
  expect(await pixels()).toBe(reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#motionToggle')).toBeEnabled();
  await page.waitForTimeout(300);
  expect(await pixels()).not.toBe(reduced);
});

test('Smokey walks within her desk area, jumps onto the cushion, and settles to sleep', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => .7; });
  await page.goto('./');
  const cat = page.locator('#smokey');
  async function advanceUntil(state, steps = 120) {
    for (let i = 0; i < steps; i++) {
      if (await cat.getAttribute('data-state') === state) return;
      await page.clock.runFor(250);
    }
    throw new Error(`Smokey never entered ${state}`);
  }
  await advanceUntil('walk');
  const start = await cat.boundingBox();
  await advanceUntil('idle');
  const end = await cat.boundingBox();
  expect(end.x).toBeGreaterThan(start.x);
  const safeArea = await page.locator('#smokeyArea').boundingBox();
  expect(end.x + end.width).toBeLessThanOrEqual(safeArea.x + safeArea.width + 1);
  await page.evaluate(() => { Math.random = () => .95; });
  await advanceUntil('jump');
  await page.clock.runFor(250);
  const airborne = await cat.boundingBox();
  expect(airborne.y).toBeLessThan(end.y);
  await advanceUntil('idle');
  await page.evaluate(() => { Math.random = () => .1; });
  await advanceUntil('sleep');
  const sleeping = await cat.boundingBox();
  expect(sleeping.y).toBeLessThan(end.y);
  expect(sleeping.y).toBeGreaterThan((await page.locator('#monitorScreen').boundingBox()).y + (await page.locator('#monitorScreen').boundingBox()).height);
});

test('mobile keeps Smokey stationary and all introduction copy accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.clock.install();
  await page.goto('./');
  const cat = page.locator('#smokey');
  const before = await cat.boundingBox();
  await page.clock.runFor(18000);
  expect(['idle', 'look', 'sleep']).toContain(await cat.getAttribute('data-state'));
  expect((await cat.boundingBox()).x).toBe(before.x);
  await page.locator('#powerToggle').click();
  await page.locator('#skipBoot').click();
  await expect(page.locator('.intro-copy')).toBeVisible();
  await expect(page.locator('.quick-actions')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
