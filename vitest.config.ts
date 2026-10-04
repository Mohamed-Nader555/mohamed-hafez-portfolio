import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'cloudflare:workers': fileURLToPath(
        new URL('./tests/fixtures/cloudflare-workers.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'tests/unit/**/*.test.ts?(x)',
      'tests/integration/**/*.test.ts?(x)',
    ],
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
