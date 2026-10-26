const { test, expect } = require('@playwright/test');

async function enter(page) {
  await page.goto('./');
  const skip = page.locator('#skipBoot');
  if (await skip.isVisible()) await skip.click();
}
async function launch(page, app) {
  await page.locator(`.shortcut[data-open="${app}"]`).click();
  const win = page.locator(`.app-window[data-app="${app}"]`);
  await win.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
  return win;
}
async function assertFits(page, locator) {
  const viewport = page.viewportSize();
  const bounds = await locator.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
  test(`all applications fit at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await enter(page);
    await assertFits(page, page.locator('body'));
    await assertFits(page, page.locator('.taskbar'));
    for (const app of ['about', 'projects', 'skills', 'experience', 'resume', 'jarvis', 'contact']) {
      const win = await launch(page, app);
      await expect(win).toBeVisible();
      await assertFits(page, win);
      await assertFits(page, win.locator('.window-content'));
      if (['projects', 'contact'].includes(app) && [1440, 390].includes(viewport.width)) {
        await page.screenshot({ path: `test-results/${app}-${viewport.width}.png` });
      }
      if (app === 'projects') {
        for (const project of ['jarvis', 'game', 'nightcrawler', 'academy']) {
          await win.locator(`[data-open="project-${project}"]`).click();
          const detail = page.locator(`[data-app="project-${project}"]`);
          await assertFits(page, detail.locator('.window-content'));
          await expect(detail.locator('.project-photo-panel img')).toHaveCSS('object-fit', 'contain');
          if (project === 'game') {
            await expect(detail.locator('.youtube-player')).toHaveAttribute('src', /wflFSHQjeUA/);
            await expect(detail.getByRole('link', { name: 'Watch on YouTube', exact: false }).first()).toHaveAttribute('href', 'https://youtu.be/wflFSHQjeUA');
          }
          await detail.locator('[data-action="close"]').click();
        }
      }
      await win.locator('[data-action="close"]').click();
    }
    expect(errors).toEqual([]);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.screenshot({ path: `test-results/desktop-${viewport.width}.png`, fullPage: true });
  });
}

test('boot, desktop controls, drag, resize, keyboard movement, and focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  await expect(page.locator('#bootScreen')).toBeVisible();
  await expect(page.locator('#skipBoot')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#bootScreen')).toBeHidden();
  await expect(page.locator('#homeTitle')).toBeFocused();
  const win = await launch(page, 'projects');
  const before = await win.boundingBox();
  const title = await win.locator('.window-label').boundingBox();
  await page.mouse.move(title.x + 70, title.y + 10);
  await page.mouse.down(); await page.mouse.move(title.x + 110, title.y + 40); await page.mouse.up();
  const dragged = await win.boundingBox();
  expect(dragged.x).toBeCloseTo(before.x + 40, 0);
  await win.focus(); await page.keyboard.press('Alt+Shift+ArrowLeft');
  expect((await win.boundingBox()).x).toBeCloseTo(dragged.x - 22, 0);
  const handle = win.locator('.window-resize');
  await handle.focus(); await page.keyboard.press('ArrowLeft');
  expect((await win.boundingBox()).width).toBeCloseTo(before.width - 20, 0);
  const corner = await handle.boundingBox();
  await page.mouse.move(corner.x + 10, corner.y + 10);
  await page.mouse.down(); await page.mouse.move(corner.x - 30, corner.y - 20); await page.mouse.up();
  expect((await win.boundingBox()).width).toBeCloseTo(before.width - 60, 0);
  await win.locator('[data-action="maximize"]').click();
  await expect(win).toHaveClass(/is-maximized/);
  await win.locator('[data-action="maximize"]').click();
  await win.focus();
  for (let i = 0; i < 40; i++) await page.keyboard.press('Alt+Shift+ArrowDown');
  const movedToEdge = await win.boundingBox();
  const desktopBounds = await page.locator('#desktop').boundingBox();
  expect(movedToEdge.y + movedToEdge.height).toBeLessThanOrEqual(desktopBounds.y + desktopBounds.height + 1);
  await win.locator('[data-action="minimize"]').click();
  await expect(win).toBeHidden();
  await page.getByRole('button', { name: 'Show my_projects' }).click();
  await expect(win).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.shortcut[data-open="projects"]')).toBeFocused();
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'day');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'day');
  await expect(page.locator('#bootScreen')).toBeHidden();
  await page.locator('#soundToggle').click();
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/desktop-day.png', fullPage: true });
});

test('JARVIS navigation, contact actions, and résumé', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await enter(page);
  const jarvis = await launch(page, 'jarvis');
  await jarvis.locator('#jarvisQuestion').fill('show projects');
  await jarvis.locator('#jarvisQuestion').press('Enter');
  await expect(page.locator('[data-app="projects"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(jarvis.locator('.user-bubble')).toHaveText('show projects');
  await page.keyboard.press('Escape');
  const contact = await launch(page, 'contact');
  await expect(contact.locator('.contact-mail')).toHaveAttribute('href', /^mailto:alejandropena.tech@gmail.com/);
  await contact.locator('[data-copy]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('alejandropena.tech@gmail.com');
  await page.keyboard.press('Escape');
  const resume = await launch(page, 'resume');
  const url = await resume.locator('iframe').getAttribute('src');
  const response = await page.request.get(url);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('reduced motion skips boot and removes rain/shortcut animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('#bootScreen')).toBeHidden();
  expect(await page.locator('.rain-pane').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  const shortcut = page.locator('.shortcut').first();
  await shortcut.hover();
  await expect(shortcut.locator('img')).toHaveCSS('transform', 'none');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
});

test('narrow resized windows retain readable content in day mode', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await page.locator('#themeToggle').click();
  for (const app of ['about', 'projects', 'skills', 'experience', 'resume', 'jarvis', 'contact']) {
    const win = await launch(page, app);
    await win.locator('.window-resize').focus();
    for (let step = 0; step < 30; step++) await page.keyboard.press('ArrowLeft');
    expect((await win.boundingBox()).width).toBeCloseTo(340, 0);
    await assertFits(page, win.locator('.window-content'));
    await assertFits(page, win.locator('.inside'));
    await win.locator('[data-action="close"]').click();
  }
});
