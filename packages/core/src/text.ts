const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const WORD_RE = /[A-Za-z0-9\u00c0-\u024f']+/gu;

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  if (CJK_RE.test(text)) {
    const cjk = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu) ?? [];
    const latin = text.match(WORD_RE) ?? [];
    return cjk.length + latin.length;
  }
  return (text.match(WORD_RE) ?? []).length;
}

export function countCharacters(text: string): number {
  return [...text].length;
}

export function documentPlainText(
  blocks: ReadonlyArray<{ text: string; type: string }>,
): string {
  return blocks
    .filter((block) => block.type !== 'divider' && block.type !== 'image')
    .map((block) => block.text)
    .join('\n\n');
}

export function excerpt(text: string, max = 180): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function decodeEntities(value: string): string {
  let text = value;
  for (let pass = 0; pass < 2; pass += 1) text = text.replace(/&amp;/gi, '&');
  return text
    .replace(/&nbsp;|&#160;|&#x0*a0;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => character(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => character(Number.parseInt(hex, 16)))
    .replace(/&[a-z][a-z0-9]+;/gi, ' ');
}

function character(code: number): string {
  if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return ' ';
  return String.fromCodePoint(code);
}

/** Tags become spaces. Does not trim, so a line break still separates the words around it. */
export function markupToText(value: string): string {
  const tag = () => /<\/?[a-z][^>]*>/gi;
  const decoded = decodeEntities(
    value.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<\?[\s\S]*?\?>/g, ' ').replace(/<!DOCTYPE[^>]*>/gi, ' '),
  );
  const stripped = decoded
    .replace(/<(script|style|svg|math|noscript|head|nav|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(tag(), ' ');
  return decodeEntities(stripped)
    .replace(tag(), ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?…])/g, '$1');
}

export function readableText(value: string): string {
  return markupToText(value).trim();
}

/** shortcut: a line of only 1–3 digits is treated as a page number; "1984" on its own stays */
export function isBoilerplate(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/^\d{1,3}$/.test(value)) return true;
  return /^(https?:\/\/|www\.)\S+$/i.test(value);
}
