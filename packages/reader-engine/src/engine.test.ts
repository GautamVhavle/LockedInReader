import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { ReaderEngine, type Clock } from './engine.js';
import { orpIndex, tokenizeDocument } from './tokenize.js';
import { tokenDelayMs } from './timing.js';

class FakeClock implements Clock {
  private nextId = 1;
  private readonly timers = new Map<number, () => void>();

  setTimeout(fn: () => void, _ms: number): unknown {
    const id = this.nextId++;
    this.timers.set(id, fn);
    return id;
  }

  clearTimeout(id: unknown): void {
    this.timers.delete(id as number);
  }

  flush(): void {
    const fns = [...this.timers.values()];
    this.timers.clear();
    for (const fn of fns) fn();
  }
}

describe('tokenize + ORP', () => {
  it('assigns classic ORP indices', () => {
    expect(orpIndex('I')).toBe(0);
    expect(orpIndex('read')).toBe(1);
    expect(orpIndex('reading')).toBe(2);
  });

  it('tokenizes CJK as individual characters', () => {
    const document = sampleDocument({
      blocks: [
        {
          ...sampleDocument().blocks[0]!,
          type: 'paragraph',
          text: '你好',
        },
      ],
    });
    expect(tokenizeDocument(document).map((token) => token.text)).toEqual(['你', '好']);
  });
});

describe('timing', () => {
  it('scales with WPM', () => {
    const [token] = tokenizeDocument(sampleDocument());
    if (!token) throw new Error('expected tokens');
    const slow = tokenDelayMs(token, {
      wpm: 200,
      mode: 'rsvp',
      chunkSize: 1,
      punctuationPauseMs: 0,
      paragraphPauseMs: 0,
      headingPauseMs: 0,
    });
    const fast = tokenDelayMs(token, {
      wpm: 400,
      mode: 'rsvp',
      chunkSize: 1,
      punctuationPauseMs: 0,
      paragraphPauseMs: 0,
      headingPauseMs: 0,
    });
    expect(slow).toBeCloseTo(fast * 2, 0);
  });
});

describe('ReaderEngine', () => {
  it('plays, pauses, seeks, and resumes deterministically', () => {
    const clock = new FakeClock();
    const engine = new ReaderEngine(clock);
    engine.load(sampleDocument());
    engine.setMode('rsvp');
    engine.setSpeed(600);
    const frames: number[] = [];
    engine.onFrame((frame) => frames.push(frame.index));
    engine.play();
    clock.flush();
    clock.flush();
    expect(engine.getState().playing).toBe(true);
    engine.pause();
    expect(engine.getState().playing).toBe(false);
    const pausedAt = engine.getState().index;
    engine.seek(0);
    expect(engine.getState().index).toBe(0);
    engine.seek(pausedAt);
    expect(engine.getState().index).toBe(pausedAt);
  });

  it('groups words in chunk mode', () => {
    const engine = new ReaderEngine();
    engine.load(sampleDocument());
    engine.setMode('chunk');
    engine.setChunkSize(2);
    expect(engine.currentFrame().tokens.length).toBeGreaterThan(1);
  });
});
