/**
 * Turns the body of a case-study MDX file into plain text sections for the
 * knowledge index. Pure string handling (no filesystem, no MDX compiler):
 * imports and component tags are removed, and component props that carry real
 * text (tables, bars, mode lists, deep-dive prose) are kept as sentences.
 */

export type PageSection = { heading: string | null; text: string };

type Prop = { kind: 'string' | 'expr' | 'flag'; value: string };
type ParsedTag = {
  name: string;
  props: Record<string, Prop>;
  selfClosing: boolean;
  /** Index just past the opening tag. */
  end: number;
};

export function splitFrontmatter(source: string): {
  frontmatter: string;
  body: string;
} {
  const text = source.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  return match
    ? { frontmatter: match[1]!, body: text.slice(match[0].length) }
    : { frontmatter: '', body: text };
}

/** Index of the character matching the opener at `start` (string/brace aware). */
function matching(source: string, start: number): number {
  const open = source[start]!;
  const close = open === '{' ? '}' : open === '[' ? ']' : ')';
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i]!;
    if (char === '"' || char === "'" || char === '`') {
      i++;
      while (i < source.length && source[i] !== char) {
        if (source[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (char === open) depth++;
    else if (char === close && --depth === 0) return i;
  }
  return source.length - 1;
}

function parseTag(source: string, from: number): ParsedTag | undefined {
  const head = /^<([A-Z][A-Za-z0-9]*)/.exec(source.slice(from));
  if (!head) return undefined;
  const name = head[1]!;
  let i = from + head[0].length;
  const props: Record<string, Prop> = {};
  while (i < source.length) {
    while (/\s/.test(source[i] ?? '')) i++;
    if (source.startsWith('/>', i))
      return { name, props, selfClosing: true, end: i + 2 };
    if (source[i] === '>')
      return { name, props, selfClosing: false, end: i + 1 };
    const attr = /^[A-Za-z_:][\w:.-]*/.exec(source.slice(i));
    if (!attr) return undefined;
    i += attr[0].length;
    if (source[i] !== '=') {
      props[attr[0]] = { kind: 'flag', value: 'true' };
      continue;
    }
    i++;
    const quote = source[i];
    if (quote === '"' || quote === "'") {
      const close = source.indexOf(quote, i + 1);
      props[attr[0]] = { kind: 'string', value: source.slice(i + 1, close) };
      i = close + 1;
    } else if (quote === '{') {
      const close = matching(source, i);
      props[attr[0]] = { kind: 'expr', value: source.slice(i + 1, close) };
      i = close + 1;
    } else return undefined;
  }
  return undefined;
}

type Scope = Record<string, unknown>;

// The MDX is repository-owned: expressions are static literals, evaluated so
// their text can be indexed. Nothing user-supplied reaches this function.
function evaluate(expression: string, scope: Scope): unknown {
  try {
    return new Function(...Object.keys(scope), `return (${expression});`)(
      ...Object.values(scope),
    );
  } catch {
    return undefined;
  }
}

/** Removes `export const name = …;` blocks and records their values. */
function takeExports(body: string, scope: Scope): string {
  let result = '';
  let index = 0;
  const pattern = /^export const (\w+) = /gm;
  for (let match = pattern.exec(body); match; match = pattern.exec(body)) {
    const valueStart = match.index + match[0].length;
    const opener = body[valueStart];
    let end = valueStart;
    if (opener === '[' || opener === '{' || opener === '(')
      end = matching(body, valueStart) + 1;
    else end = body.indexOf('\n', valueStart);
    scope[match[1]!] = evaluate(body.slice(valueStart, end), scope);
    if (body[end] === ';') end++;
    result += body.slice(index, match.index);
    index = end;
    pattern.lastIndex = end;
  }
  return result + body.slice(index);
}

const sentence = (text: string) =>
  /[.!?…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

const asString = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

function propValue(tag: ParsedTag, name: string, scope: Scope): unknown {
  const prop = tag.props[name];
  if (!prop) return undefined;
  return prop.kind === 'string' ? prop.value : evaluate(prop.value, scope);
}

function componentText(tag: ParsedTag, children: string, scope: Scope): string {
  const prop = (name: string) => propValue(tag, name, scope);
  switch (tag.name) {
    case 'DeepDive':
      return `${sentence(asString(prop('title')))} ${children}`;
    case 'CompareTable': {
      const columns = asArray(prop('columns')).map(asString);
      const rows = asArray(prop('rows')).map((row) =>
        asArray(row)
          .map((cell, index) => `${columns[index] ?? ''}: ${asString(cell)}`)
          .join(', '),
      );
      return `${sentence(asString(prop('caption')))} ${rows.join('; ')}.`;
    }
    case 'ResultBars': {
      const labels = asArray(prop('groupLabels')).map(asString);
      const suffix = asString(prop('suffix') ?? '');
      const items = asArray(prop('items')).map((item) => {
        const row = record(item);
        const value = `${asString(row.value)}${suffix}`;
        const group =
          row.groupValue === undefined
            ? ''
            : `, ${labels[1] ?? 'second'} ${asString(row.groupValue)}${suffix}`;
        return `${asString(row.label)}: ${labels[0] ? `${labels[0]} ` : ''}${value}${group}`;
      });
      return `${sentence(asString(prop('title')))} ${items.join('; ')}.`;
    }
    case 'ModeSwitch':
      return asArray(prop('modes'))
        .map((mode) => {
          const row = record(mode);
          const features = asArray(row.features)
            .map((feature) => {
              const item = record(feature);
              return `${asString(item.title)} (${asString(item.detail)})`;
            })
            .join('; ');
          return `${asString(row.label)} offers: ${features}.`;
        })
        .join(' ');
    case 'StageMatrix': {
      const stages = asArray(prop('stageLabels')).map(asString);
      const matrices = record(prop('matrices'));
      const rows = asArray(prop('strategies')).map((strategy) => {
        const matrix = asArray(matrices[asString(strategy)]);
        const last = asArray(matrix[matrix.length - 1]).map(
          (value, index) => `${stages[index] ?? ''} ${asString(value)}`,
        );
        return `${asString(strategy)}: after the last stage, ${last.join(', ')}`;
      });
      return `${sentence(asString(prop('title')))} ${rows.join('; ')}.`;
    }
    case 'SubProjectGrid':
      return asArray(prop('items'))
        .map((item) =>
          Object.entries(record(item))
            .map(([key, value]) =>
              key === 'title'
                ? `${asString(value)}.`
                : `${key[0]!.toUpperCase()}${key.slice(1)}: ${asString(value)}`,
            )
            .join(' '),
        )
        .join(' ');
    default:
      // Components fed by frontmatter or other data files are indexed from
      // those sources instead.
      return '';
  }
}

/** Replaces every component block in `source` with its text. */
function replaceComponents(source: string, scope: Scope): string {
  let out = '';
  let index = 0;
  const lineStart = /^[ \t]*<[A-Z]/gm;
  for (let m = lineStart.exec(source); m; m = lineStart.exec(source)) {
    if (m.index < index) continue;
    const tagStart = source.indexOf('<', m.index);
    const tag = parseTag(source, tagStart);
    if (!tag) continue;
    let end = tag.end;
    let children = '';
    if (!tag.selfClosing) {
      const closing = source.indexOf(`</${tag.name}>`, tag.end);
      if (closing < 0) continue;
      children = replaceComponents(source.slice(tag.end, closing), scope)
        .split('\n')
        .map((line) => line.trim())
        .join('\n');
      end = closing + `</${tag.name}>`.length;
    }
    const text = componentText(tag, children, scope).trim();
    out += source.slice(index, m.index) + (text ? `\n\n${text}\n\n` : '\n\n');
    index = end;
    lineStart.lastIndex = end;
  }
  return out + source.slice(index);
}

function stripMarkdown(line: string): string {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractMdxSections(
  body: string,
  frontmatter: unknown = {},
): PageSection[] {
  const scope: Scope = { frontmatter };
  const withoutExports = takeExports(body.replace(/\r\n/g, '\n'), scope);
  const withoutImports = withoutExports.replace(/^import .*$/gm, '');
  const text = replaceComponents(withoutImports, scope);

  const sections: PageSection[] = [];
  let current: { heading: string | null; lines: string[] } = {
    heading: null,
    lines: [],
  };
  const flush = () => {
    const paragraphs = current.lines
      .join('\n')
      .split(/\n{2,}/)
      .map((paragraph) =>
        paragraph
          .split('\n')
          .map((line) =>
            stripMarkdown(
              line
                .replace(/^\s*[-*+]\s+/, '')
                .replace(/^\s*\d+\.\s+/, '')
                .replace(/^\s*>\s?/, '')
                .replace(/^#{3,6}\s+/, ''),
            ),
          )
          .filter(Boolean)
          .join(' '),
      )
      .filter(Boolean);
    if (paragraphs.length)
      sections.push({
        heading: current.heading,
        text: paragraphs.join('\n\n'),
      });
  };
  for (const line of text.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      current = { heading: stripMarkdown(heading[1]!), lines: [] };
    } else current.lines.push(line);
  }
  flush();
  return sections;
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Splits a section over `maxWords` at paragraph breaks (and, for one very long
 * paragraph, at sentence breaks) so each chunk stays focused.
 */
export function splitLongText(text: string, maxWords = 180): string[] {
  if (wordCount(text) <= maxWords) return [text.replace(/\n{2,}/g, ' ')];
  const units = text
    .split(/\n{2,}/)
    .flatMap((paragraph) =>
      wordCount(paragraph) > maxWords
        ? (paragraph.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [paragraph])
        : [paragraph],
    )
    .map((unit) => unit.trim())
    .filter(Boolean);
  const groups: string[] = [];
  let current = '';
  for (const unit of units) {
    if (current && wordCount(`${current} ${unit}`) > maxWords) {
      groups.push(current);
      current = unit;
    } else current = current ? `${current} ${unit}` : unit;
  }
  if (current) groups.push(current);
  return groups;
}
