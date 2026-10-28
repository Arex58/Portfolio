const { test, expect } = require('@playwright/test');

test.use({ reducedMotion: 'reduce' });
async function powerOn(page) {
  await page.goto('./');
  await page.locator('#powerToggle').click();
  await expect(page.locator('#monitorStage')).toHaveAttribute('data-power','on');
}
function deskKey(page, value) { return page.locator(`.desk-key[data-key=${JSON.stringify(value)}]`); }

test('desk keys open JARVIS, edit selected text, shift, submit, and disable on power off', async ({page}) => {
  await page.setViewportSize({width:1440,height:1500});
  await page.goto('./');
  await expect(deskKey(page,'a')).toBeDisabled();
  await expect(page.locator('#deskMouse')).toBeDisabled();
  await page.locator('#powerToggle').click();
  await expect(deskKey(page,'a')).toBeEnabled();
  for(const value of 'hellp') await deskKey(page,value).click();
  const input=page.locator('#jarvisQuestion');
  await expect(input).toHaveValue('hellp');
  await deskKey(page,'Backspace').click();
  await deskKey(page,'o').click();
  await expect(input).toHaveValue('hello');
  await input.evaluate(el=>{el.focus();el.setSelectionRange(0,5);});
  await deskKey(page,'Shift').click();
  await deskKey(page,'h').click();
  await deskKey(page,'Shift').click();
  await deskKey(page,'i').click();
  await expect(input).toHaveValue('Hi');
  await deskKey(page,' ').click();
  await deskKey(page,'1').click();
  await expect(input).toHaveValue('Hi 1');
  await deskKey(page,'Enter').click();
  await expect(page.locator('.user-bubble')).toHaveText('Hi 1');
  await expect(input).toHaveValue('');
  await page.locator('#powerToggle').click();
  await expect(deskKey(page,'a')).toBeDisabled();
  await expect(page.locator('#deskCursor')).toBeHidden();
});

test('desk mouse drag moves the screen cursor and tap opens the pointed application', async ({page}) => {
  await page.setViewportSize({width:1440,height:1500});
  await powerOn(page);
  const screen=await page.locator('#monitorLive').boundingBox();
  const target=await page.locator('.shortcut[data-open="jarvis"]').boundingBox();
  const pad=await page.locator('#mousePad').evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));
  const mouse=await page.locator('#deskMouse').boundingBox();
  const dx=((target.x+target.width/2-screen.x)/screen.width-.5)*Math.max(120,pad.width);
  const dy=((target.y+target.height/2-screen.y)/screen.height-.5)*Math.max(120,pad.height);
  await page.mouse.move(mouse.x+20,mouse.y+20);
  await page.mouse.down();
  await page.mouse.move(mouse.x+20+dx,mouse.y+20+dy,{steps:8});
  await page.mouse.up();
  await expect(page.locator('#deskCursor')).toBeVisible();
  await expect(page.locator('.shortcut[data-open="jarvis"]')).toHaveClass(/desk-pointed/);
  await expect(page.locator('[data-app="jarvis"]')).toHaveCount(0);
  await page.locator('#deskMouse').click();
  await expect(page.locator('[data-app="jarvis"]')).toBeVisible();
  await page.locator('#deskMouse').focus();
  const before=await page.locator('#deskCursor').boundingBox();
  await page.keyboard.press('ArrowLeft');
  expect((await page.locator('#deskCursor').boundingBox()).x).toBeLessThan(before.x);
  await page.keyboard.press('Escape');
  await expect(page.locator('#deskCursor')).toBeHidden();
});

for(const width of [1440,768,390,320]) {
  test(`Smokey logo and usable desk controls fit at ${width}px`, async({page})=>{
    await page.setViewportSize({width,height:1000});
    await powerOn(page);
    await expect(page.locator('.wall-print,.room-shelf,.monitor-off-mark,.boot-emblem')).toHaveCount(0);
    await expect(page.locator('#smokeyLogo,#deskMouseHelp')).toHaveCount(0);
    await expect(page.locator('.start-btn img')).toHaveAttribute('src','assets/smokey-face.svg');
    expect(await page.locator('.start-btn img').evaluate(el=>el.complete && el.naturalWidth>0)).toBe(true);
    for(const selector of ['.retro-keyboard','#deskMouse','.smokey']) {
      const bounds=await page.locator(selector).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await deskKey(page,'a').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#jarvisQuestion')).toHaveValue('a');
    await expect(deskKey(page,'a')).toBeFocused();
    await page.locator('[data-app="jarvis"] [data-action="close"]').click();
    await page.mouse.move(0,0);
    await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
    await page.screenshot({path:`test-results/desk-controls-${width}.png`,fullPage:true});
  });
}

test('touch keyboard opens JARVIS and submits a message', async ({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8000/Portfolio/');
  await page.locator('#powerToggle').tap();
  await expect(deskKey(page,'h')).toBeEnabled();
  await deskKey(page,'h').tap();
  await deskKey(page,'i').tap();
  await expect(page.locator('#jarvisQuestion')).toHaveValue('hi');
  await deskKey(page,'Enter').tap();
  await expect(page.locator('.user-bubble')).toHaveText('hi');
  await context.close();
});
