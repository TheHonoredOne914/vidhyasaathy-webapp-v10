import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5183';
const proof = 'C:/Users/jce/proof';
await mkdir(proof, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
const calls = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => { if (response.url().includes('/api/')) calls.push({ url: new URL(response.url()).pathname, status: response.status() }); });
const shot = (name) => page.screenshot({ path: `${proof}/saathy-${name}.png`, fullPage: true });
const action = async (name, run) => { await run(); console.log(`PASS ${name}`); };
try {
  await action('Aarav PIN sign-in', async () => {
    await page.goto(`${base}/signin/student`);
    await page.getByLabel('Your name', { exact: true }).fill('Aarav');
    for (const [i, digit] of [...'2468'].entries()) await page.getByLabel(i ? `PIN ${i + 1}` : 'PIN', { exact: true }).fill(digit);
    await page.getByRole('button', { name: 'Open my notebook' }).click();
    await expect(page).toHaveURL(/\/student/);
    await page.goto(`${base}/student/saathy`);
    await expect(page.getByRole('heading', { name: /ready when you are/ })).toBeVisible();
    await expect(page.getByLabel('Chapter', { exact: true }).locator('option')).not.toHaveCount(0);
    await shot('welcome-desktop');
  });
  await action('History toggle and chapter selection', async () => {
    await page.getByRole('button', { name: 'Hide history', exact: true }).click();
    await expect(page.getByLabel('Chats and concepts')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show history', exact: true }).click();
    const subjects = await page.getByLabel('Subject', { exact: true }).locator('option').allTextContents();
    const science = subjects.find((item) => /science/i.test(item));
    if (science) await page.getByLabel('Subject', { exact: true }).selectOption({ label: science });
    await expect(page.getByLabel('Chapter', { exact: true }).locator('option')).not.toHaveCount(0);
    const options = await page.getByLabel('Chapter', { exact: true }).locator('option').allTextContents();
    const motion = options.find((item) => /^motion$/i.test(item));
    if (motion) await page.getByLabel('Chapter', { exact: true }).selectOption({ label: motion });
  });
  await action('Explore chapter map and chapter flow', async () => {
    await page.getByRole('button', { name: 'Learning modules', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'How you’ll learn' })).toBeVisible();
    await page.getByRole('button', { name: 'Chapter flow', exact: true }).click();
    await page.locator('.studio-flow summary').first().click();
    await shot('chapter-flow');
    await page.getByRole('button', { name: 'Concept map', exact: true }).click();
    await shot('concept-map');
  });
  const studio = page.getByRole('dialog');
  await action('Slide navigation, dots and keyboard', async () => {
    await studio.getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(studio.locator('.studio-paper')).toBeVisible();
    await studio.getByRole('button', { name: 'Next slide', exact: true }).click();
    await studio.getByRole('button', { name: 'Previous slide', exact: true }).click();
    await studio.getByRole('button', { name: 'Go to slide 2', exact: true }).click();
    await studio.locator('.studio-body').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(studio.getByText(/^Slide 1 of/)).toBeVisible();
    await shot('slides');
  });
  await action('Server-scored quiz and not-taught evidence', async () => {
    await studio.getByRole('button', { name: 'Try', exact: true }).click();
    await studio.getByRole('radio').first().check();
    await studio.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(studio.getByRole('button', { name: 'Next question', exact: true })).toBeVisible();
    await shot('quiz-feedback');
    await studio.getByRole('button', { name: 'Next question', exact: true }).click();
    await studio.getByRole('radio', { name: "Haven't learned this yet", exact: true }).check();
    await studio.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(studio.getByText('New', { exact: true })).toBeVisible();
  });
  await action('Flashcard flip, reflection, shuffle and revisit', async () => {
    await studio.getByRole('button', { name: 'Fix', exact: true }).click();
    await studio.getByRole('button', { name: 'Flip flashcard', exact: true }).click();
    await shot('flashcards');
    await studio.getByRole('button', { name: 'Not yet', exact: true }).click();
    await studio.getByRole('button', { name: 'Shuffle remaining cards', exact: true }).click();
    while (await studio.getByRole('button', { name: 'Flip flashcard', exact: true }).count()) {
      await studio.getByRole('button', { name: 'Flip flashcard', exact: true }).click();
      await studio.getByRole('button', { name: 'Got it', exact: true }).click();
    }
    await studio.getByRole('button', { name: 'Revisit not-yet cards', exact: true }).click();
    await expect(studio.getByText(/^Card 1 of 1$/)).toBeVisible();
  });
  await action('Registry game and return', async () => {
    await studio.getByRole('button', { name: 'Play', exact: true }).click();
    const play = studio.getByRole('button', { name: /^Play / });
    if (await play.count()) {
      await play.first().click();
      await expect(studio.locator('iframe')).toBeVisible();
      await shot('game');
      await studio.getByRole('button', { name: 'Back to games', exact: true }).click();
    }
    await shot('game-shelf');
  });
  await action('Report uses server evidence', async () => {
    await studio.getByRole('button', { name: 'Master', exact: true }).click();
    await expect(studio.getByText(/answers saved/)).toBeVisible();
    await shot('report');
    await studio.getByRole('button', { name: 'Exit learning modules', exact: true }).click();
  });
  await action('Chat, prerequisite check and response actions', async () => {
    await page.getByRole('button', { name: 'Explain fully', exact: true }).click();
    await page.getByRole('textbox', { name: 'Your doubt', exact: true }).fill('Explain the difference between distance and displacement with an example.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop generating', exact: true })).toHaveCount(0, { timeout: 45000 });
    const check = page.getByRole('region', { name: 'Level Check', exact: true });
    if (await check.count()) {
      while (await check.getByRole('button', { name: "Haven't learned this yet", exact: true }).count()) {
        await check.getByRole('button', { name: "Haven't learned this yet", exact: true }).click();
        await check.getByRole('button', { name: /^(Next idea|Save my check)$/ }).click();
      }
      await check.getByRole('button', { name: 'Continue learning', exact: true }).click();
    }
    await expect(page.getByRole('button', { name: 'Copy reply', exact: true }).last()).toBeVisible({ timeout: 45000 });
    await page.getByRole('button', { name: 'Copy reply', exact: true }).last().click();
    await page.getByRole('button', { name: 'Save reply', exact: true }).last().click();
    await expect(page.getByText('Explanation saved.', { exact: true })).toBeVisible();
    await shot('chat');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download chat', exact: true }).click();
    await (await download).saveAs(`${proof}/saathy-conversation.html`);
    await page.getByRole('button', { name: 'New chat', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search conversations', exact: true }).fill('distance');
    await shot('history');
  });
  await action('Mobile layout and keyboard modal exit', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Hide history', exact: true }).click();
    await shot('welcome-mobile');
    await page.getByRole('button', { name: 'Learning modules', exact: true }).first().click();
    await shot('modules-mobile');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log('PASS no browser exceptions');
} finally {
  await writeFile(`${proof}/saathy-browser-results.json`, JSON.stringify({ errors, calls }, null, 2));
  await browser.close();
}
