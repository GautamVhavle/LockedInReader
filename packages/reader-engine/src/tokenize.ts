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
  kind: TokenKind;
  isParagraphStart: boolean;
  isRtl: boolean;
}

export function orpIndex(word: string): number {
  const len = [...word].length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
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
    return text.split(/\s+/).filter(Boolean).map((part, i, all) => ({
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
  for (const block of document.blocks) {
    if (block.type === 'divider' || block.type === 'image') continue;
    const isCode = block.type === 'code';
    const parts = splitText(block.text, isCode);
    parts.forEach((part, index) => {
      tokens.push({
        text: part.text,
        orpIndex: orpIndex(part.text),
        blockId: block.id,
        blockType: block.type,
        blockOffset: part.offset,
        wordIndex: wordIndex++,
        kind: classify(part.text, isCode),
        isParagraphStart: index === 0 && (block.type === 'paragraph' || block.type === 'heading'),
        isRtl: RTL_RE.test(part.text),
      });
    });
  }
  return tokens;
}
