import type { ReaderToken } from './tokenize.js';

export interface StageParts {
  before: string;
  pivot: string;
  after: string;
}

export function stageParts(tokens: ReaderToken[]): StageParts | undefined {
  if (tokens.length === 0) return undefined;
  const pivotAt = Math.floor((tokens.length - 1) / 2);
  const pivot = tokens[pivotAt];
  if (!pivot) return undefined;
  const chars = [...pivot.text];
  const orp = Math.min(pivot.orpIndex, Math.max(0, chars.length - 1));
  const beforeWords = tokens
    .slice(0, pivotAt)
    .map((token) => token.text)
    .join(' ');
  const afterWords = tokens
    .slice(pivotAt + 1)
    .map((token) => token.text)
    .join(' ');
  return {
    before: `${beforeWords ? `${beforeWords} ` : ''}${chars.slice(0, orp).join('')}`,
    pivot: chars[orp] ?? '·',
    after: `${chars.slice(orp + 1).join('')}${afterWords ? ` ${afterWords}` : ''}`,
  };
}
