import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { ReaderEngine, type Clock } from './engine.js';
import { stageParts } from './stage.js';
import { orpIndex, tokenizeDocument } from './tokenize.js';
import { chunkDelayMs, clampWpm, remainingLabel, tokenDelayMs, type TimingConfig } from './timing.js';

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

  pending(): number {
    return this.timers.size;
  }
}

function prose(text: string) {
  const base = sampleDocument();
  return sampleDocument({
    blocks: [{ ...base.blocks[1]!, text }],
  });
}

describe('tokenize + ORP', () => {
  it('assigns classic ORP indices', () => {
    expect(orpIndex('I')).toBe(0);
    expect(orpIndex('read')).toBe(1);
    expect(orpIndex('reading')).toBe(2);
    expect(orpIndex('reading,')).toBe(orpIndex('reading'));
    expect(orpIndex('(read)')).toBe(2);
  });

  it('keeps abbreviations inside the sentence and splits on the real stop', () => {
    const base = sampleDocument();
    const paragraph = base.blocks[1]!;
    const document = sampleDocument({
      blocks: [{ ...paragraph, text: 'Dr. Smith went home. Then he left.' }],
    });
    const tokens = tokenizeDocument(document);
    expect(tokens.map((token) => token.sentenceIndex)).toEqual([0, 0, 0, 0, 1, 1, 1]);
    expect(tokens.filter((token) => token.isSentenceEnd).map((token) => token.text)).toEqual([
      'home.',
      'left.',
    ]);
  });

  it('keeps initialisms and decimals inside the sentence', () => {
    const tokens = tokenizeDocument(
      prose('Born in the U.S. army. Pi is 3.14 today. He said "go." Then left.'),
    );
    expect(tokens.map((token) => token.text)).toEqual([
      'Born',
      'in',
      'the',
      'U.S.',
      'army.',
      'Pi',
      'is',
      '3.14',
      'today.',
      'He',
      'said',
      '"go."',
      'Then',
      'left.',
    ]);
    expect(tokens.find((token) => token.text === '3.14')?.kind).toBe('number');
    expect(tokens.find((token) => token.text === 'U.S.')?.isSentenceEnd).toBe(false);
    expect(tokens.filter((token) => token.isSentenceEnd).map((token) => token.text)).toEqual([
      'army.',
      'today.',
      '"go."',
      'left.',
    ]);
  });

  it('drops urls and bare citation markers from prose', () => {
    const tokens = tokenizeDocument(prose('Read https://example.com/a and see [12] now.'));
    expect(tokens.map((token) => token.text)).toEqual(['Read', 'and', 'see', 'now.']);
  });

  it('treats each block without a stop as its own sentence', () => {
    const base = sampleDocument();
    const tokens = tokenizeDocument(
      sampleDocument({
        blocks: [
          { ...base.blocks[0]!, text: 'Hello there' },
          { ...base.blocks[1]!, text: 'Next line' },
        ],
      }),
    );
    expect(tokens.map((token) => token.sentenceIndex)).toEqual([0, 0, 1, 1]);
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

const quiet: TimingConfig = {
  wpm: 300,
  mode: 'chunk',
  chunkSize: 4,
  punctuationPauseMs: 0,
  paragraphPauseMs: 0,
  headingPauseMs: 0,
};

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

  it('times a short phrase as the sum of its words', () => {
    const [token] = tokenizeDocument(sampleDocument());
    if (!token) throw new Error('expected tokens');
    expect(chunkDelayMs([token], quiet)).toBe(tokenDelayMs(token, quiet));
    expect(chunkDelayMs([token, token], quiet)).toBe(tokenDelayMs(token, quiet) * 2);
  });

  it('pauses longer on a sentence stop than on a comma or an opening paren', () => {
    const config: TimingConfig = { ...quiet, mode: 'orp', punctuationPauseMs: 80 };
    const tokens = tokenizeDocument(prose('Hello, see notes (later) now.'));
    const hello = tokens[0];
    const notes = tokens.find((token) => token.text === 'notes');
    const now = tokens.find((token) => token.text === 'now.');
    if (!hello || !notes || !now) throw new Error('expected tokens');
    const base = tokenDelayMs(
      { ...hello, text: 'Hello', isParagraphStart: false, isSentenceEnd: false },
      config,
    );
    expect(tokenDelayMs(hello, config, tokens[1])).toBe(base + 40);
    expect(tokenDelayMs(notes, config, tokens[tokens.indexOf(notes) + 1])).toBe(base + 40);
    expect(tokenDelayMs(now, config)).toBe(base + 80);
  });

  it('slows numbers, long words, and code', () => {
    const config: TimingConfig = { ...quiet, punctuationPauseMs: 0 };
    const plain = tokenizeDocument(prose('word'))[0];
    const number = tokenizeDocument(prose('123456'))[0];
    const long = tokenizeDocument(prose('absolutely'))[0];
    const base = sampleDocument();
    const code = tokenizeDocument(
      sampleDocument({
        blocks: [{ ...base.blocks[1]!, type: 'code', text: 'word' }],
      }),
    )[0];
    if (!plain || !number || !long || !code) throw new Error('expected tokens');
    const plainDelay = tokenDelayMs({ ...plain, isParagraphStart: false }, config);
    expect(tokenDelayMs({ ...number, isParagraphStart: false }, config)).toBeCloseTo(
      plainDelay * 1.35,
      5,
    );
    expect(tokenDelayMs({ ...long, isParagraphStart: false }, config)).toBeCloseTo(
      plainDelay * 1.2,
      5,
    );
    expect(tokenDelayMs({ ...code, isParagraphStart: false }, config)).toBeCloseTo(
      plainDelay * 1.8,
      5,
    );
  });

  it('formats the time left from the unread words', () => {
    expect(remainingLabel(0, 350)).toBe('0:00');
    expect(remainingLabel(350, 350)).toBe('1:00');
    expect(remainingLabel(90, 360)).toBe('0:15');
  });
});

describe('stage', () => {
  it('pins the anchor letter and keeps the other words beside it', () => {
    expect(stageParts(tokenizeDocument(prose('reading')))).toEqual({
      before: 're',
      pivot: 'a',
      after: 'ding',
    });
    expect(stageParts(tokenizeDocument(prose('one two three')))).toEqual({
      before: 'one t',
      pivot: 'w',
      after: 'o three',
    });
    expect(stageParts([])).toBeUndefined();
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

  it('shows every phrase, including a short tail, then stops', () => {
    const clock = new FakeClock();
    const base = sampleDocument();
    const engine = new ReaderEngine(clock);
    engine.load(
      sampleDocument({
        blocks: [{ ...base.blocks[1]!, text: 'one two three four five' }],
      }),
    );
    engine.setMode('chunk');
    engine.setChunkSize(2);
    const shown: string[][] = [];
    engine.onFrame((frame) => {
      if (frame.playing) shown.push(frame.tokens.map((token) => token.text));
    });
    engine.play();
    engine.play();
    let guard = 0;
    while (engine.getState().playing && guard < 20) {
      clock.flush();
      guard += 1;
    }
    expect(shown).toEqual([['one', 'two'], ['three', 'four'], ['five']]);
    expect(engine.getState().finished).toBe(true);
    expect(engine.getState().index).toBe(4);
    engine.play();
    expect(engine.getState().playing).toBe(true);
    expect(engine.getState().index).toBe(0);
  });

  it('ignores an empty document and clamps seek and phrase size', () => {
    const clock = new FakeClock();
    const engine = new ReaderEngine(clock);
    engine.load(prose('   '));
    engine.play();
    expect(engine.getState().playing).toBe(false);
    expect(clock.pending()).toBe(0);
    engine.load(prose('one two three four'));
    engine.seek(-10);
    expect(engine.getState().index).toBe(0);
    engine.seek(99);
    expect(engine.getState().index).toBe(3);
    engine.setMode('chunk');
    engine.setChunkSize(0);
    expect(engine.currentFrame().tokens).toHaveLength(1);
  });

  it('keeps a single timer while playing', () => {
    const clock = new FakeClock();
    const engine = new ReaderEngine(clock);
    engine.load(prose('one two three four'));
    engine.play();
    expect(clock.pending()).toBe(1);
    engine.play();
    engine.setSpeed(800);
    expect(clock.pending()).toBe(1);
    engine.pause();
    expect(clock.pending()).toBe(0);
    engine.pause();
    expect(engine.getState().playing).toBe(false);
  });

  it('does not move past the first or last sentence', () => {
    const engine = new ReaderEngine();
    engine.load(prose('One stop. Two stop.'));
    engine.jumpSentence(-1);
    expect(engine.getState().index).toBe(0);
    engine.jumpSentence(1);
    engine.jumpSentence(1);
    expect(engine.currentSentence().map((token) => token.text)).toEqual(['Two', 'stop.']);
  });

  it('keeps speed inside 80 to 1200 words per minute', () => {
    const engine = new ReaderEngine(new FakeClock());
    expect(clampWpm(20)).toBe(80);
    expect(clampWpm(4000)).toBe(1200);
    engine.setSpeed(20);
    expect(engine.getState().wpm).toBe(80);
    engine.setSpeed(4000);
    expect(engine.getState().wpm).toBe(1200);
    engine.setSpeed(Number.NaN);
    expect(engine.getState().wpm).toBe(1200);
  });

  it('jumps by sentence and can return to the current sentence start', () => {
    const base = sampleDocument();
    const engine = new ReaderEngine();
    engine.load(
      sampleDocument({
        blocks: [{ ...base.blocks[1]!, text: 'Dr. Smith went home. Then he left.' }],
      }),
    );
    engine.seek(2);
    engine.jumpSentence(-1);
    expect(engine.getState().index).toBe(0);
    engine.seek(2);
    engine.jumpSentence(1);
    expect(engine.currentSentence().map((token) => token.text)).toEqual(['Then', 'he', 'left.']);
    engine.jumpSentence(1);
    expect(engine.getState().index).toBe(4);
  });
});
