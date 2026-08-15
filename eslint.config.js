import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.astro/',
      '.wrangler/',
      'dist/',
      'bundled/',
      'node_modules/',
      'worker-configuration.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
);
