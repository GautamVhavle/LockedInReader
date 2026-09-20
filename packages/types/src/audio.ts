import { z } from 'zod';
import {
  AssetIdSchema,
  AudioDocumentIdSchema,
  AudioSegmentIdSchema,
  DocumentIdSchema,
  IsoTimestampSchema,
} from './ids.js';

export const AudioProviderKindSchema = z.enum(['browser-tts', 'generated', 'local-tts']);
export type AudioProviderKind = z.infer<typeof AudioProviderKindSchema>;

export const AudioWordTimestampSchema = z.object({
  wordIndex: z.number().int().nonnegative(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
});
export type AudioWordTimestamp = z.infer<typeof AudioWordTimestampSchema>;

export const AudioSegmentSchema = z.object({
  id: AudioSegmentIdSchema,
  documentId: DocumentIdSchema,
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  blockId: z.string().uuid(),
  text: z.string(),
  audioAssetId: AssetIdSchema.optional(),
  durationMs: z.number().nonnegative().optional(),
  timestamps: z.array(AudioWordTimestampSchema).default([]),
  order: z.number().int().nonnegative(),
});
export type AudioSegment = z.infer<typeof AudioSegmentSchema>;

export const AudioDocumentSchema = z.object({
  id: AudioDocumentIdSchema,
  documentId: DocumentIdSchema,
  provider: AudioProviderKindSchema,
  voice: z.string().optional(),
  rate: z.number().positive().default(1),
  segments: z.array(AudioSegmentSchema).default([]),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type AudioDocument = z.infer<typeof AudioDocumentSchema>;
