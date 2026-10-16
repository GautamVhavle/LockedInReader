import type { ReadingMode } from '@locked-in/types';
import { endsSentence, type ReaderToken } from './tokenize.js';

export const WPM_MIN = 80;
export const WPM_MAX = 1200;
export const WPM_DEFAULT = 350;

export function clampWpm(value: number): number {
  return Math.min(WPM_MAX, Math.max(WPM_MIN, value));
}

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

export function remainingLabel(words: number, wpm: number): string {
  const seconds = Math.max(0, Math.round((words / Math.max(50, wpm)) * 60));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function hasSoftPause(token: ReaderToken, next: ReaderToken | undefined): boolean {
  if (/[,;:、，)）]$/.test(token.text)) return true;
  return Boolean(next && /^[(（[]/.test(next.text));
}

export function tokenDelayMs(token: ReaderToken, config: TimingConfig, next?: ReaderToken): number {
  let delay = baseIntervalMs(config.wpm);
  if (token.kind === 'number') delay *= 1.35;
  if ([...token.text].length > 8) delay *= 1.2;
  if (token.kind === 'code') delay *= 1.8;
  if (endsSentence(token.text)) delay += config.punctuationPauseMs;
  else if (hasSoftPause(token, next)) delay += Math.round(config.punctuationPauseMs / 2);
  if (token.isParagraphStart) delay += config.paragraphPauseMs;
  if (token.blockType === 'heading') delay += config.headingPauseMs;
  return Math.max(16, delay);
}

export function chunkDelayMs(
  tokens: ReaderToken[],
  config: TimingConfig,
  following?: ReaderToken,
): number {
  if (tokens.length === 0) return baseIntervalMs(config.wpm);
  return tokens.reduce((sum, token, index) => {
    const next = tokens[index + 1] ?? following;
    return sum + tokenDelayMs(token, config, next);
  }, 0);
}
