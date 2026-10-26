const { test, expect } = require('@playwright/test');

async function enter(page) {
  await page.goto('./');
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#monitorLive')).toHaveAttribute('inert', '');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'on');
  await expect(page.locator('#monitorLive')).not.toHaveAttribute('inert', '');
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
    await expect(page.locator('.desk-scene img')).toHaveAttribute('src', 'assets/rainy-desk-pixel.png');
    await expect(page.locator('.desk-scene img')).toHaveCSS('image-rendering', 'pixelated');
    await expect(page.locator('.menubar, .annotation, .scene-caption, .shelf-label')).toHaveCount(0);
    const rain = await page.locator('.rain-pane').boundingBox();
    const desktop = await page.locator('#desktop').boundingBox();
    expect(rain.width).toBeCloseTo(desktop.width, 0);
    expect(rain.height).toBeCloseTo(desktop.height, 0);
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

test('monitor power, desktop controls, drag, resize, keyboard movement, and focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#monitorLive')).toHaveAttribute('inert', '');
  await expect(page.locator('#musicToggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'on');
  await expect(page.locator('#monitorLive')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#musicToggle')).toHaveAttribute('aria-pressed', 'true');
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
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await page.locator('#powerToggle').click();
  await page.locator('#soundToggle').click();
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await expect(page.locator('#musicToggle')).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: 'test-results/desktop-day.png', fullPage: true });
});

test('music is opt-in, reflects player state, stops on close, and fits on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    window.musicTest = { plays: 0, pauses: 0, startAt: [] };
    HTMLMediaElement.prototype.play = function () {
      window.musicTest.plays++;
      window.musicTest.startAt.push(this.currentTime);
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      window.musicTest.pauses++;
      this.dispatchEvent(new Event('pause'));
    };
  });
  await enter(page);
  const toggle = page.locator('#musicToggle');
  const audio = page.locator('#backgroundMusic');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#musicPanel')).toBeHidden();
  await page.locator('#musicVolumeToggle').click();
  await expect(page.locator('#musicPanel')).toBeVisible();
  await expect(audio).toHaveAttribute('src', 'assets/background-music.mp3');
  await expect(audio).toHaveAttribute('loop', '');
  await assertFits(page, page.locator('#musicPanel'));
  await assertFits(page, page.locator('.taskbar'));
  expect(await page.evaluate(() => window.musicTest.plays)).toBe(1);
  expect(await page.evaluate(() => window.musicTest.startAt[0])).toBe(0);
  expect(await audio.evaluate(el => el.volume)).toBeCloseTo(0.3);
  const volume = page.locator('#musicVolume');
  await expect(volume).toHaveAttribute('aria-label', 'Background music volume');
  await expect(page.locator('#musicVolumeValue')).toHaveText('30%');
  await volume.focus();
  await page.keyboard.press('End');
  await expect(volume).toHaveValue('100');
  await expect(page.locator('#musicVolumeValue')).toHaveText('100%');
  expect(await audio.evaluate(el => el.volume)).toBe(1);
  await page.locator('#musicToggle').click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#musicPanel')).toBeHidden();
  expect(await page.evaluate(() => window.musicTest.pauses)).toBe(1);
  await toggle.click();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.musicTest.startAt[1])).toBe(0);
  await expect(volume).toHaveValue('100');
  await expect(audio).toHaveJSProperty('volume', 1);
  await page.locator('#musicVolumeToggle').click();
  await expect(page.locator('#musicPanel')).toBeVisible();
  await page.locator('#musicClose').click();
  await expect(page.locator('#musicVolumeToggle')).toBeFocused();
  await expect(page.locator('#musicPanel')).toBeHidden();
  expect(await page.evaluate(() => window.musicTest.pauses)).toBe(1);
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  expect(await page.evaluate(() => window.musicTest.pauses)).toBe(2);
  await page.reload();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('music uses the local MP3 without loading the YouTube player API', async ({ page }) => {
  let youtubeRequests = 0;
  await page.route('https://www.youtube.com/iframe_api', async route => {
    youtubeRequests++;
    await route.abort();
  });
  await enter(page);
  await expect(page.locator('#backgroundMusic')).toHaveAttribute('src', 'assets/background-music.mp3');
  expect(youtubeRequests).toBe(0);
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

test('reduced motion keeps the monitor powerable and removes rain/shortcut animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power', 'off');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('#powerToggle').click();
  expect(await page.locator('.rain-pane').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  const shortcut = page.locator('.shortcut').first();
  await shortcut.hover();
  await expect(shortcut.locator('img')).toHaveCSS('transform', 'none');
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
