import { expect, test } from '@playwright/test';

// Run against the existing demo server; never reset its database.
test.skip(!process.env.E2E_BASE_URL, 'Start npm run demo and set E2E_BASE_URL.');
test.setTimeout(240000);
test.use({ viewport: { width: 800, height: 600 }, hasTouch: true });

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`Atom Forge intro and controls with motion preference ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/signin/student');
    await page.getByRole('button', { name: 'Aarav', exact: true }).click();
    for (const [index, digit] of [...'2468'].entries()) {
      await page.getByRole('textbox', { name: index === 0 ? 'PIN' : `PIN ${index + 1}`, exact: true }).fill(digit);
    }
    await page.getByRole('button', { name: 'Open my notebook' }).click();
    await page.waitForURL((url) => url.pathname === '/student');
    await page.goto('/student/games/atom');
    await expect(page.getByRole('button', { name: 'Enter the atom', exact: true })).toBeVisible({ timeout: 30000 });
    await expect.poll(() => page.locator('.iris').evaluate((element) => {
      const style = getComputedStyle(element);
      return style.display === 'none' || style.clipPath === 'circle(0% at 50% 50%)';
    }), { timeout: 30000 }).toBe(true);
    await page.screenshot({ path: test.info().outputPath('atom-intro.png') });
    await page.getByRole('button', { name: 'Enter the atom', exact: true }).click();
    await expect(page.locator('[data-afv-phase="play"]')).toBeVisible();
    if (reducedMotion === 'reduce') {
      const game = page.getByRole('main', { name: 'Atom Forge' });
      const act = async () => {
        const skip = page.getByRole('button', { name: 'Your turn', exact: true });
        if (await skip.isVisible()) await skip.click();
        await expect(game).toHaveAttribute('data-afv-phase', 'act');
      };
      const next = async () => {
        await expect(game).toHaveAttribute('data-afv-phase', 'branch');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await act();
      };
      await act();
      const hold = page.getByRole('button', { name: 'Hold to zoom', exact: true });
      await hold.focus();
      await page.keyboard.down('Space');
      await expect(hold).not.toHaveText('Hold to zoom · 0%');
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await page.keyboard.up('Space');
      await expect(hold).toHaveText('Hold to zoom · 0%', { timeout: 15000 });
      await page.keyboard.down('Space');
      await expect(game).toHaveAttribute('data-afv-phase', 'branch', { timeout: 15000 });
      await page.keyboard.up('Space');
      await next();

      await page.getByRole('button', { name: 'Tap proton', exact: true }).tap();
      await expect(page.getByRole('button', { name: 'Pinned proton', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Tap neutron', exact: true }).tap();
      await next();

      const keep = page.getByRole('button', { name: 'Keep this nucleus' });
      await expect(keep).toBeDisabled();
      await page.getByRole('button', { name: 'Add neutron', exact: true }).tap();
      await expect(page.getByText('5 neutrons', { exact: true })).toBeVisible();
      const add = page.getByRole('button', { name: 'Add neutron', exact: true });
      const tray = await add.boundingBox();
      if (!tray) throw new Error('Neutron tray missing');
      await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2);
      await page.mouse.down();
      await page.mouse.move(400, 280, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByText('6 neutrons', { exact: true })).toBeVisible();
      await add.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByText('Remove 1 to make carbon-12', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Remove neutron', exact: true }).click();
      await expect(keep).toBeEnabled();
      // Spinning the scene must not silently remove neutrons.
      await page.mouse.move(400, 230);
      await page.mouse.down();
      await page.mouse.move(420, 430, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByText('6 neutrons', { exact: true })).toBeVisible();
      await keep.click();
      await next();

      await page.getByRole('button', { name: 'Shell K', exact: true }).tap();
      await expect(page.getByRole('status')).toHaveText("Let's fix this: K is full");
      await page.getByRole('button', { name: 'Shell M', exact: true }).tap();
      await next();

      const isotopes = page.getByRole('button', { name: 'Isotopes', exact: true });
      const isobars = page.getByRole('button', { name: 'Isobars', exact: true });
      await isobars.click();
      await expect(page.getByRole('status')).toHaveText("Let's fix this: compare Z and A");
      // Drop the actual transferred card, not the currently selected card.
      const transfer = await page.evaluateHandle(() => {
        const data = new DataTransfer(); data.setData('text/plain', 'ca40'); return data;
      });
      await isobars.dispatchEvent('drop', { dataTransfer: transfer });
      await expect(page.getByRole('button', { name: 'Ca-40 · Z 20 · placed', exact: true })).toBeDisabled();
      await isotopes.tap();
      await isotopes.tap();
      await isobars.tap();
      await next();

      await page.getByRole('button', { name: 'Add proton', exact: true }).tap();
      await expect(page.getByText(/Nitrogen · Z 7 · A 13/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Check my recall' })).toBeDisabled();
      await page.getByRole('combobox', { name: 'What sets Z?', exact: true }).selectOption('neutrons');
      await page.getByRole('combobox', { name: '6 protons + 8 neutrons: A?', exact: true }).selectOption('fourteen');
      await page.getByRole('combobox', { name: 'Same Z, different A?', exact: true }).selectOption('isotopes');
      await page.getByRole('button', { name: 'Check my recall' }).click();
      await expect(game).toHaveAttribute('data-afv-phase', 'act');
      await page.getByRole('combobox', { name: 'What sets Z?', exact: true }).selectOption('protons');
      await page.getByRole('button', { name: 'Check my recall' }).click();
      await page.getByRole('button', { name: 'See my recap' }).click();
      await expect(page.getByRole('heading', { name: 'Your atom recap' })).toBeVisible();

      await page.getByRole('button', { name: 'Explore again' }).click();
      await act();
      await page.getByRole('slider', { name: 'Cutscene timeline' }).fill('1');
      await expect(game).toHaveAttribute('data-afv-playing', '1');
      await expect(page.locator('[data-afv-time]')).not.toHaveText('1 / 7s');
      // Revisiting the same chapter resets sorted cards and their selection.
      await page.getByRole('button', { name: 'Same element, different mass', exact: true }).click();
      await act();
      await expect(page.getByRole('button', { name: 'C-12 · Z 6', exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByRole('link', { name: 'Back to games', exact: true }).click();
    await expect(page).toHaveURL(/\/student\?panel=games$/);
    expect(errors).toEqual([]);
  });
}
