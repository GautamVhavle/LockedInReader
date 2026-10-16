import type { BlockType, CanonicalDocument } from '@locked-in/types';

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const RTL_RE = /[\u0590-\u08ff]/u;

export type TokenKind = 'word' | 'number' | 'cjk' | 'code' | 'punct';

export interface ReaderToken {
  text: string;
  orpIndex: number;
  blockId: string;
  blockType: BlockType;
  blockOffset: number;
  wordIndex: number;
  sentenceIndex: number;
  kind: TokenKind;
  isParagraphStart: boolean;
  isSentenceEnd: boolean;
  isRtl: boolean;
}

function isPunctChar(char: string): boolean {
  return /\p{P}/u.test(char);
}

/** Index of the eye-anchor letter. Edge punctuation does not shift it. */
export function orpIndex(word: string): number {
  const chars = [...word];
  let start = 0;
  let end = chars.length;
  while (start < end && isPunctChar(chars[start] ?? '')) start += 1;
  while (end > start && isPunctChar(chars[end - 1] ?? '')) end -= 1;
  const core = end - start;
  if (core <= 0) return 0;
  const local = core <= 1 ? 0 : core <= 5 ? 1 : core <= 9 ? 2 : core <= 13 ? 3 : 4;
  return start + Math.min(local, core - 1);
}

export function endsSentence(text: string): boolean {
  const bare = text.replace(/^["'“‘(\[]+|["'”’)\]]+$/gu, '');
  if (!bare) return false;
  if (/^(mr|mrs|ms|dr|prof|sr|jr|vs|etc|eg|ie|st|fig|al)\.$/i.test(bare)) return false;
  // shortcut: dotted initialisms such as U.S. never end a sentence, even when the next word starts one
  if (/^(?:[A-Za-z]\.)+$/.test(bare)) return false;
  return /[.!?…。！？]$/.test(bare);
}

function isSkippable(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text) || /^www\.\S+$/i.test(text) || /^\[\d{1,3}\]$/.test(text);
}

function classify(text: string, isCode: boolean): TokenKind {
  if (isCode) return 'code';
  if (CJK_RE.test(text) && text.length <= 2) return 'cjk';
  if (/^\d+([.,]\d+)?$/.test(text)) return 'number';
  if (/^[\p{P}]+$/u.test(text)) return 'punct';
  return 'word';
}

function splitText(text: string, isCode: boolean): Array<{ text: string; offset: number }> {
  if (!text) return [];
  if (isCode) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .map((part, i, all) => ({
        text: part,
        offset: all.slice(0, i).reduce((sum, item) => sum + item.length + 1, 0),
      }));
  }
  const parts: Array<{ text: string; offset: number }> = [];
  const re = CJK_RE.test(text)
    ? /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]|[A-Za-z0-9][A-Za-z0-9'’.-]*|[^\s]/gu
    : /\S+/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    parts.push({ text: match[0], offset: match.index });
  }
  return parts;
}

export function tokenizeDocument(document: CanonicalDocument): ReaderToken[] {
  const tokens: ReaderToken[] = [];
  let wordIndex = 0;
  let sentenceIndex = 0;
  for (const block of document.blocks) {
    if (block.type === 'divider' || block.type === 'image') continue;
    const isCode = block.type === 'code';
    const parts = splitText(block.text, isCode).filter((part) => isCode || !isSkippable(part.text));
    if (parts.length === 0) continue;
    const previous = tokens[tokens.length - 1];
    if (previous && !previous.isSentenceEnd) sentenceIndex += 1;
    parts.forEach((part, index) => {
      const end = endsSentence(part.text);
      tokens.push({
        text: part.text,
        orpIndex: orpIndex(part.text),
        blockId: block.id,
        blockType: block.type,
        blockOffset: part.offset,
        wordIndex: wordIndex++,
        sentenceIndex,
        kind: classify(part.text, isCode),
        isParagraphStart: index === 0 && (block.type === 'paragraph' || block.type === 'heading'),
        isSentenceEnd: end,
        isRtl: RTL_RE.test(part.text),
      });
      if (end) sentenceIndex += 1;
    });
  }
  return tokens;
}
