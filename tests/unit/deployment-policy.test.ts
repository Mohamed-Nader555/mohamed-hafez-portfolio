import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Cloudflare static deployment policy', () => {
  it('allows only the required first-party, Web Analytics, and Turnstile origins', async () => {
    const headers = await readFile(resolve('public/_headers'), 'utf8');
    const csp = headers
      .split(/\r?\n/)
      .find((line) => line.trimStart().startsWith('Content-Security-Policy:'));

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain(
      "script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
    );
    expect(csp).toContain(
      "connect-src 'self' https://cloudflareinsights.com https://challenges.cloudflare.com",
    );
    expect(csp).toContain('frame-src https://challenges.cloudflare.com');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline|\s\*\s|https:\s/i);
  });

  it('sets restrictive browser headers and production-safe HSTS', async () => {
    const headers = await readFile(resolve('public/_headers'), 'utf8');

    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain(
      'Referrer-Policy: strict-origin-when-cross-origin',
    );
    expect(headers).toContain('X-Frame-Options: DENY');
    expect(headers).toMatch(
      /Permissions-Policy:.*camera=\(\).*microphone=\(\)/,
    );
    expect(headers).toContain(
      'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    );
    expect(headers).not.toContain('preload');
  });

  it('redirects the index filename to the single canonical home route', async () => {
    const redirects = await readFile(resolve('public/_redirects'), 'utf8');

    expect(redirects).toMatch(/^\/index\.html\s+\/\s+301$/m);
  });
});
