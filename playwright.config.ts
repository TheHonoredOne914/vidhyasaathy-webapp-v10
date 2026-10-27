import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    ...(process.env.E2E_BASE_URL ? { baseURL: process.env.E2E_BASE_URL } : {}),
    trace: 'retain-on-failure',
  },
});
