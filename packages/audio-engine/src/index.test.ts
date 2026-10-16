import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { AudioTimeline, createAudioDocument, speechParts } from './index.js';

describe('audio engine', () => {
  it('segments a document and seeks the timeline', () => {
    const audio = createAudioDocument(sampleDocument());
    expect(audio.provider).toBe('browser-tts');
    expect(audio.segments.length).toBeGreaterThan(0);
    const timeline = new AudioTimeline(audio);
    expect(timeline.current?.order).toBe(0);
    timeline.next();
    expect(timeline.current?.order).toBe(1);
  });

  it('speaks prose and skips code', () => {
    expect(
      speechParts([
        { type: 'paragraph', text: 'One.' },
        { type: 'code', text: '<p>const x = 1</p>' },
        { type: 'paragraph', text: 'Two.' },
      ]),
    ).toEqual(['One.\nTwo.']);
  });
});
