import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'tests/unit/**/*.test.ts?(x)',
      'tests/integration/**/*.test.ts?(x)',
    ],
    setupFiles: ['tests/setup.ts'],
  },
});
