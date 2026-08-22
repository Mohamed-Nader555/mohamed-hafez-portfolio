import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { resolvePublicSiteUrl } from './src/lib/seo/site-url.ts';

const localFallback = process.env.CI ? undefined : 'https://portfolio.test';
const site = resolvePublicSiteUrl(process.env.PUBLIC_SITE_URL, localFallback);

export default defineConfig({
  // Keep build/prerender fully local. The on-demand route receives real bindings only in Cloudflare.
  adapter: cloudflare({ remoteBindings: false }),
  // The portfolio supplies its own fixed UI; keep Astro's development overlay from covering it on phones.
  devToolbar: { enabled: false },
  integrations: [react(), mdx(), sitemap()],
  output: 'server',
  session: false,
  site: site.href,
});
