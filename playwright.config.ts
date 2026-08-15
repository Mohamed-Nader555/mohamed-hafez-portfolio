import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    env: {
      ASTRO_DEV_BACKGROUND: '0',
      PUBLIC_SITE_URL: 'https://portfolio.test',
    },
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4321/@vite/client',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
});
