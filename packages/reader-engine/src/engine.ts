import type { CanonicalDocument, ReaderPosition, ReadingMode } from '@locked-in/types';
import { chunkDelayMs, tokenDelayMs, type TimingConfig } from './timing.js';
import { tokenizeDocument, type ReaderToken } from './tokenize.js';

export interface ReaderFrame {
  tokens: ReaderToken[];
  index: number;
  mode: ReadingMode;
  playing: boolean;
  progress: number;
  delayMs: number;
}

export interface ReaderState {
  mode: ReadingMode;
  wpm: number;
  chunkSize: number;
  index: number;
  playing: boolean;
  tokenCount: number;
}

export interface Clock {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

const defaultClock: Clock = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export class ReaderEngine {
  private document: CanonicalDocument | undefined;
  private tokens: ReaderToken[] = [];
  private index = 0;
  private playing = false;
  private timer: unknown;
  private readonly listeners = new Set<(frame: ReaderFrame) => void>();
  private config: TimingConfig = {
    wpm: 350,
    mode: 'orp',
    chunkSize: 1,
    punctuationPauseMs: 80,
    paragraphPauseMs: 220,
    headingPauseMs: 320,
  };

  constructor(private readonly clock: Clock = defaultClock) {}

  load(document: CanonicalDocument): void {
    this.pause();
    this.document = document;
    this.tokens = tokenizeDocument(document);
    this.index = 0;
    this.emit();
  }

  onFrame(listener: (frame: ReaderFrame) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (!this.tokens.length) return;
    this.playing = true;
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.timer !== undefined) this.clock.clearTimeout(this.timer);
    this.timer = undefined;
    this.emit();
  }

  seek(wordIndex: number): void {
    this.index = Math.max(0, Math.min(wordIndex, Math.max(0, this.tokens.length - 1)));
    this.emit();
  }

  next(): void {
    this.seek(this.index + this.step());
  }

  previous(): void {
    this.seek(this.index - this.step());
  }

  setMode(mode: ReadingMode): void {
    this.config = { ...this.config, mode };
    this.emit();
  }

  setSpeed(wpm: number): void {
    this.config = { ...this.config, wpm };
    this.emit();
  }

  setChunkSize(chunkSize: number): void {
    this.config = { ...this.config, chunkSize: Math.max(1, chunkSize) };
    this.emit();
  }

  setTiming(partial: Partial<TimingConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getState(): ReaderState {
    return {
      mode: this.config.mode,
      wpm: this.config.wpm,
      chunkSize: this.config.chunkSize,
      index: this.index,
      playing: this.playing,
      tokenCount: this.tokens.length,
    };
  }

  getTokens(): ReaderToken[] {
    return this.tokens;
  }

  position(): ReaderPosition | undefined {
    const token = this.tokens[this.index];
    if (!token || !this.document) return undefined;
    return {
      documentId: this.document.id,
      blockId: token.blockId as ReaderPosition['blockId'],
      offset: token.blockOffset,
      wordIndex: token.wordIndex,
    };
  }

  currentFrame(): ReaderFrame {
    const tokens = this.currentTokens();
    const delay = this.currentDelay(tokens);
    return {
      tokens,
      index: this.index,
      mode: this.config.mode,
      playing: this.playing,
      progress: this.tokens.length ? this.index / this.tokens.length : 0,
      delayMs: delay,
    };
  }

  private step(): number {
    return this.config.mode === 'chunk' ? this.config.chunkSize : 1;
  }

  private currentTokens(): ReaderToken[] {
    if (this.config.mode === 'chunk') {
      return this.tokens.slice(this.index, this.index + this.config.chunkSize);
    }
    const token = this.tokens[this.index];
    return token ? [token] : [];
  }

  private currentDelay(tokens: ReaderToken[]): number {
    if (this.config.mode === 'chunk') return chunkDelayMs(tokens, this.config);
    const token = tokens[0];
    return token ? tokenDelayMs(token, this.config) : 0;
  }

  private tick(): void {
    if (!this.playing) return;
    this.emit();
    const tokens = this.currentTokens();
    const delay = this.currentDelay(tokens);
    this.timer = this.clock.setTimeout(() => {
      if (this.index + this.step() >= this.tokens.length) {
        this.playing = false;
        this.index = Math.max(0, this.tokens.length - 1);
        this.emit();
        return;
      }
      this.index += this.step();
      this.tick();
    }, delay);
  }

  private emit(): void {
    const frame = this.currentFrame();
    for (const listener of this.listeners) listener(frame);
  }
}
