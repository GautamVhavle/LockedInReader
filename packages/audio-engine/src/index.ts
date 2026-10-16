import { documentPlainText } from '@locked-in/core';
import {
  createAudioDocumentId,
  createAudioSegmentId,
  nowIso,
  type AudioDocument,
  type AudioSegment,
  type CanonicalDocument,
} from '@locked-in/types';

export interface TTSUtterance {
  text: string;
  rate: number;
  voice?: string;
}

export interface TTSProvider {
  readonly kind: AudioDocument['provider'];
  speak(utterance: TTSUtterance): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}

export function segmentDocument(document: CanonicalDocument): AudioSegment[] {
  return document.blocks
    .filter((block) => block.text.trim() && block.type !== 'image' && block.type !== 'divider')
    .map((block, order) => ({
      id: createAudioSegmentId(),
      documentId: document.id,
      startOffset: 0,
      endOffset: block.text.length,
      blockId: block.id,
      text: block.text,
      order,
      timestamps: [],
    }));
}

export function createAudioDocument(
  document: CanonicalDocument,
  provider: AudioDocument['provider'] = 'browser-tts',
): AudioDocument {
  const now = nowIso();
  return {
    id: createAudioDocumentId(),
    documentId: document.id,
    provider,
    rate: 1,
    segments: segmentDocument(document),
    createdAt: now,
    updatedAt: now,
  };
}

export class AudioTimeline {
  private index = 0;
  constructor(readonly audio: AudioDocument) {}

  get current(): AudioSegment | undefined {
    return this.audio.segments[this.index];
  }

  seek(index: number): AudioSegment | undefined {
    this.index = Math.max(0, Math.min(index, this.audio.segments.length - 1));
    return this.current;
  }

  next(): AudioSegment | undefined {
    return this.seek(this.index + 1);
  }

  previous(): AudioSegment | undefined {
    return this.seek(this.index - 1);
  }

  segmentAt(timeMs: number): AudioSegment | undefined {
    let elapsed = 0;
    for (const segment of this.audio.segments) {
      const duration = segment.durationMs ?? Math.max(800, segment.text.length * 40);
      if (timeMs < elapsed + duration) return segment;
      elapsed += duration;
    }
    return this.audio.segments.at(-1);
  }
}

export function narrationText(document: CanonicalDocument): string {
  return documentPlainText(document.blocks);
}

const SKIPPED_SPEECH = new Set(['code', 'image', 'divider']);

export function narrationChunks(parts: string[], limit = 1400): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    const piece = part.trim();
    if (!piece) continue;
    if (current && current.length + piece.length + 1 > limit) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n${piece}` : piece;
    }
    if (current.length >= limit) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function speechParts(blocks: Array<{ type: string; text: string }>): string[] {
  return narrationChunks(
    blocks
      .filter((block) => !SKIPPED_SPEECH.has(block.type) && block.text.trim())
      .map((block) => block.text.trim()),
  );
}

export class BrowserTTSProvider implements TTSProvider {
  readonly kind = 'browser-tts' as const;
  private utterance: SpeechSynthesisUtterance | undefined;
  private halted = false;

  /** Clear a previous stop. Waits after cancel so the next phrase is not dropped. */
  async start(): Promise<void> {
    this.halted = false;
    if (typeof speechSynthesis === 'undefined') return;
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    await new Promise((resolve) => setTimeout(resolve, 60));
  }

  async speak(utterance: TTSUtterance): Promise<void> {
    if (this.halted) throw new Error('stopped');
    if (typeof speechSynthesis === 'undefined') {
      throw new Error('Browser TTS is not available in this environment');
    }
    await new Promise<void>((resolve, reject) => {
      if (this.halted) {
        reject(new Error('stopped'));
        return;
      }
      this.utterance = new SpeechSynthesisUtterance(utterance.text);
      this.utterance.rate = utterance.rate;
      this.utterance.onend = () => resolve();
      this.utterance.onerror = () => reject(new Error(this.halted ? 'stopped' : 'Speech failed'));
      speechSynthesis.speak(this.utterance);
    });
  }

  async pause(): Promise<void> {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.pause();
  }

  async resume(): Promise<void> {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.resume();
  }

  async stop(): Promise<void> {
    this.halted = true;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }
}
