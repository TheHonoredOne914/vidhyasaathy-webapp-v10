import { expect, type Page } from '@playwright/test';

export async function registerSchool(page: Page, schoolName: string, email: string): Promise<void> {
  await page.goto('/register-school');
  await page.getByRole('button', { name: 'Next: Admin Information' }).click();
  await expect(page.getByText('Enter a value.').first()).toBeVisible();
  await page.getByLabel('School name').fill(schoolName);
  await page.getByLabel('City').fill('Pune');
  await page.getByLabel('School type').selectOption({ label: 'Private' });
  await page.getByLabel('Board / Affiliation').selectOption({ label: 'CBSE' });
  await page.getByLabel('School email').fill(email);
  await page.getByLabel('Phone number').fill('9876543210');
  await page.getByRole('button', { name: 'Next: Admin Information' }).click();
  await page.getByRole('button', { name: 'Next: Review' }).click();
  await expect(page.getByText('Enter a value.').first()).toBeVisible();
  await expect(page.getByText('Use at least 12 characters.')).toBeVisible();
  await page.getByLabel('Your name').fill('Mina Rao');
  await page.getByLabel('Password').fill('correct horse battery');
  await page.getByRole('button', { name: 'Next: Review' }).click();
  await page.getByRole('button', { name: 'Next: Confirm' }).click();
  await page.getByRole('button', { name: 'Register school' }).click();
}
