import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [react(), mdx(), sitemap()],
  output: 'server',
  session: false,
});
