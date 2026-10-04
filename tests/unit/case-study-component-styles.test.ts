import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Guard against the "unstyled component" regression: ArchitectureFlow once
// shipped with `architecture-flow*` class names while the only matching CSS
// targeted the old `architecture-diagram*` names, so every diagram rendered as
// bare numbered lists. Every case-study component's root class must have a
// rule in its own <style> block or in a global stylesheet under src/styles/.
const componentDir = path.resolve('src/components/case-study');
const stylesDir = path.resolve('src/styles');

function readCss(): string {
  return readdirSync(stylesDir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(path.join(stylesDir, file), 'utf8'))
    .join('\n');
}

function splitComponent(source: string) {
  const frontmatterEnd = source.indexOf('\n---', source.indexOf('---') + 3);
  const afterFrontmatter =
    frontmatterEnd === -1 ? source : source.slice(frontmatterEnd + 4);
  const styleMatch = afterFrontmatter.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const markup = afterFrontmatter.replace(/<style[^>]*>[\s\S]*?<\/style>/, '');
  return { markup, style: styleMatch?.[1] ?? '' };
}

function rootClass(markup: string): string | undefined {
  const match = markup.match(/\bclass=(?:"([^"]+)"|\{`([^`$]+)[^`]*`\})/);
  const value = match?.[1] ?? match?.[2];
  return value?.trim().split(/\s+/)[0];
}

const components = readdirSync(componentDir).filter((file) =>
  file.endsWith('.astro'),
);

describe('case-study component styles', () => {
  it('finds the case-study components', () => {
    expect(components.length).toBeGreaterThan(10);
  });

  const globalCss = readCss();

  it.each(components)(
    '%s root class has a matching rule in its <style> block or src/styles/',
    (file) => {
      const { markup, style } = splitComponent(
        readFileSync(path.join(componentDir, file), 'utf8'),
      );
      const root = rootClass(markup);

      expect(root, `${file} has no root class`).toBeTruthy();

      const selector = new RegExp(`\.${root}(?![\w-])`);
      expect(
        selector.test(style) || selector.test(globalCss),
        `${file}: no CSS rule found for .${root}`,
      ).toBe(true);
    },
  );

  it('no stylesheet still targets the removed architecture-diagram classes', () => {
    expect(globalCss).not.toMatch(/architecture-diagram/);
  });
});
