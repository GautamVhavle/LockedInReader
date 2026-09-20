import type { ReadingMode } from '@locked-in/types';
import type { ReaderToken } from './tokenize.js';

export interface TimingConfig {
  wpm: number;
  mode: ReadingMode;
  chunkSize: number;
  punctuationPauseMs: number;
  paragraphPauseMs: number;
  headingPauseMs: number;
}

export function baseIntervalMs(wpm: number): number {
  return 60000 / Math.max(50, wpm);
}

export function tokenDelayMs(token: ReaderToken, config: TimingConfig): number {
  let delay = baseIntervalMs(config.wpm);
  if (token.kind === 'number') delay *= 1.35;
  if (token.text.length > 8) delay *= 1.2;
  if (token.kind === 'code') delay *= 1.8;
  if (/[.,;:!?…。、]$/.test(token.text)) delay += config.punctuationPauseMs;
  if (token.isParagraphStart) delay += config.paragraphPauseMs;
  if (token.blockType === 'heading') delay += config.headingPauseMs;
  return Math.max(16, delay);
}

export function chunkDelayMs(tokens: ReaderToken[], config: TimingConfig): number {
  if (tokens.length === 0) return baseIntervalMs(config.wpm);
  const total = tokens.reduce((sum, token) => sum + tokenDelayMs(token, config), 0);
  return total / Math.max(1, tokens.length / config.chunkSize);
}
