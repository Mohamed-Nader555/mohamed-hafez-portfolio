import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  addScriptHashes,
  inlineScriptHashes,
} from '../../scripts/add-csp-script-hashes';

// Production serves `Content-Security-Policy: ... style-src 'self'` (see
// public/_headers). That blocks inline <style> elements and style="..."
// attributes, so anything that depends on one silently disappears in
// production while working in the dev server (which sends no CSP): bars
// rendered empty and component styles were dropped. These tests keep the
// source and the built HTML inside the policy.
function walk(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function stripComments(source: string) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

describe('style-src self compliance', () => {
  it('declares a style-src that forbids inline styles', () => {
    const headers = readFileSync(path.resolve('public/_headers'), 'utf8');
    expect(headers).toMatch(/style-src 'self'(?:;|\s|$)/);
    expect(headers).not.toMatch(/style-src[^;\n]*'unsafe-inline'/);
  });

  it('keeps inline style attributes out of components, layouts, pages, and content', () => {
    const files = walk(path.resolve('src')).filter((file) =>
      /\.(astro|mdx|tsx)$/.test(file),
    );
    expect(files.length).toBeGreaterThan(50);

    for (const file of files) {
      const text = stripComments(readFileSync(file, 'utf8'));
      expect(
        /\sstyle\s*=\s*[{"']/.test(text),
        `${path.relative(process.cwd(), file)} uses an inline style attribute`,
      ).toBe(false);
    }
  });

  it("carries Astro's island helper rule in the global stylesheet", () => {
    const css = readFileSync(path.resolve('src/styles/global.css'), 'utf8');
    expect(css).toMatch(
      /astro-island,\s*astro-slot,\s*astro-static-slot\s*\{\s*display:\s*contents;/,
    );
  });

  it('configures Astro to emit external stylesheets and scripts instead of inlining them', () => {
    const config = readFileSync(path.resolve('astro.config.mjs'), 'utf8');
    expect(config).toMatch(/inlineStylesheets:\s*['"]never['"]/);
    expect(config).toMatch(/assetsInlineLimit:\s*0(?![\d.])/);
  });

  const distClient = path.resolve('dist/client');

  it.skipIf(!existsSync(distClient))(
    'ships no style attributes and no inline stylesheets in the built HTML',
    () => {
      const pages = walk(distClient).filter((file) => file.endsWith('.html'));
      expect(pages.length).toBeGreaterThan(30);

      for (const file of pages) {
        const html = readFileSync(file, 'utf8');
        const relative = path.relative(distClient, file);

        expect(
          /\sstyle=["']/.test(html),
          `${relative} has a style attribute`,
        ).toBe(false);

        // Astro still emits two kinds of inline <style> that the policy
        // blocks: the per-element `view-transition-name` rule behind
        // `transition:name` (the morph degrades to a plain navigation) and the
        // island helper rule, which global.css carries for us.
        for (const match of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
          expect(
            match[1],
            `${relative} has an unexpected inline <style>`,
          ).toMatch(
            /^(\[data-astro-transition-scope=|astro-island,astro-slot,astro-static-slot\{display:contents\})/,
          );
        }
      }
    },
  );

  it.skipIf(!existsSync(distClient))(
    'allow-lists every inline script by SHA-256 hash, without unsafe-inline',
    () => {
      const headers = readFileSync(path.join(distClient, '_headers'), 'utf8');
      const csp = headers
        .split('\n')
        .find((line) => /Content-Security-Policy:/i.test(line));
      const scriptSrc = csp?.match(/script-src([^;]*)/)?.[1] ?? '';
      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).not.toContain("'unsafe-inline'");

      const pages = walk(distClient).filter((file) => file.endsWith('.html'));
      expect(pages.length).toBeGreaterThan(30);

      let inline = 0;
      for (const file of pages) {
        const relative = path.relative(distClient, file);
        for (const hash of inlineScriptHashes(readFileSync(file, 'utf8'))) {
          inline += 1;
          expect(
            scriptSrc,
            `${relative} has an inline script missing from script-src`,
          ).toContain(hash);
        }
      }
      // The island bootstrap alone appears on every page with the assistant.
      expect(inline).toBeGreaterThan(0);
    },
  );

  it.skipIf(!existsSync(distClient))(
    'draws bar charts with SVG attributes that survive the policy',
    () => {
      const html = readFileSync(
        path.join(distClient, 'research', 'asc-pie', 'index.html'),
        'utf8',
      );
      expect(html).toMatch(/<svg[^>]*class="bar-chart__bar"/);
      expect(html).toMatch(/<rect x="0" y="0" width="99\.1"/);
      expect(html).toMatch(/<rect[^>]*class="result-bars__fill"/);
    },
  );
});

describe('inline script hashing', () => {
  const html = [
    '<script type="application/ld+json">{"a":1}</script>',
    '<script src="/_astro/app.js"></script>',
    '<script>   </script>',
    '<script type="module">console.log(1)</script>',
    '<script>console.log(1)</script>',
    '<script type="text/plain">ignored</script>',
  ].join('');

  it('hashes only non-empty executable inline scripts', () => {
    const hashes = inlineScriptHashes(html);
    // The two identical bodies hash the same; everything else is skipped.
    expect(hashes).toHaveLength(2);
    expect(new Set(hashes).size).toBe(1);
    expect(hashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]{43}='$/);
  });

  it('adds hashes to script-src only, keeps other sources, and is idempotent', () => {
    const headers = [
      '/*',
      "  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'",
      '  X-Frame-Options: DENY',
    ].join('\n');

    const once = addScriptHashes(headers, ["'sha256-bbb='", "'sha256-aaa='"]);
    expect(once).toContain(
      "script-src 'self' https://challenges.cloudflare.com 'sha256-aaa=' 'sha256-bbb='; style-src 'self'",
    );
    expect(once).toContain("default-src 'self';");
    expect(once).toContain('X-Frame-Options: DENY');
    expect(once).not.toContain('unsafe-inline');

    // Re-running with a different set replaces the old hashes.
    const twice = addScriptHashes(once, ["'sha256-ccc='"]);
    expect(twice).toContain(
      "script-src 'self' https://challenges.cloudflare.com 'sha256-ccc=';",
    );
    expect(twice).not.toContain('sha256-aaa=');
  });
});
