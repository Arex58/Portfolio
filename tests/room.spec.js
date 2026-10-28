const { test, expect } = require('@playwright/test');

test('startup enables music and sounds and can be skipped, cancelled, and repeated', async ({ page }) => {
  await page.goto('./');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'booting');
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#backgroundMusic')).toHaveJSProperty('paused', false);
  await expect(page.locator('#monitorLive')).toHaveAttribute('inert', '');
  await expect(page.locator('#skipBoot')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'on');
  await expect(page.locator('#homeTitle')).toBeFocused();
  await expect(page.locator('#backgroundMusic')).toHaveJSProperty('paused', false);
  await page.locator('#powerToggle').click();
  await expect(page.locator('#backgroundMusic')).toHaveJSProperty('paused', true);
  await page.locator('#powerToggle').click();
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#backgroundMusic')).toHaveJSProperty('paused', true);
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

test('Smokey stays on the cushion during a full minute of room animation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.install();
  await page.goto('./');
  const cat = page.locator('#smokey');
  const before = await cat.boundingBox();
  for (let i=0; i<6; i++) {
    await page.clock.runFor(10000);
    expect(await cat.getAttribute('data-state')).toBe('idle');
    expect(await cat.boundingBox()).toEqual(before);
  }
});

test('mobile keeps Smokey stationary and all introduction copy accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.clock.install();
  await page.goto('./');
  const power = await page.locator('#powerToggle').boundingBox();
  expect(power.y + power.height).toBeLessThanOrEqual(740);
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
