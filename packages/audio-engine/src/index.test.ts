import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { AudioTimeline, createAudioDocument } from './index.js';

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
});
