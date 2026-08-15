import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { resolvePublicSiteUrl } from './src/lib/seo/site-url.ts';

const localFallback = process.env.CI ? undefined : 'https://portfolio.test';
const site = resolvePublicSiteUrl(process.env.PUBLIC_SITE_URL, localFallback);

export default defineConfig({
  adapter: cloudflare(),
  integrations: [react(), mdx(), sitemap()],
  output: 'server',
  session: false,
  site: site.href,
});
