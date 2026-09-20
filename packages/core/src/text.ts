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
