import { z } from 'zod';
import {
  BookmarkIdSchema,
  CollectionIdSchema,
  DocumentIdSchema,
  IsoTimestampSchema,
  SessionIdSchema,
  TagIdSchema,
} from './ids.js';
import { DocumentLocationSchema, ReaderPositionSchema } from './location.js';
import { ReadingModeSchema } from './reading.js';

export const CollectionSchema = z.object({
  id: CollectionIdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  documentIds: z.array(DocumentIdSchema).default([]),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type Collection = z.infer<typeof CollectionSchema>;

export const TagSchema = z.object({
  id: TagIdSchema,
  name: z.string().min(1),
  createdAt: IsoTimestampSchema,
});
export type Tag = z.infer<typeof TagSchema>;

export const BookmarkSchema = z.object({
  id: BookmarkIdSchema,
  documentId: DocumentIdSchema,
  location: DocumentLocationSchema,
  label: z.string().optional(),
  createdAt: IsoTimestampSchema,
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const ReadingProgressSchema = z.object({
  documentId: DocumentIdSchema,
  position: ReaderPositionSchema,
  percent: z.number().min(0).max(100),
  wordsRead: z.number().int().nonnegative().default(0),
  lastMode: ReadingModeSchema.default('normal'),
  updatedAt: IsoTimestampSchema,
});
export type ReadingProgress = z.infer<typeof ReadingProgressSchema>;

export const ReadingSessionSchema = z.object({
  id: SessionIdSchema,
  documentId: DocumentIdSchema,
  mode: ReadingModeSchema,
  startedAt: IsoTimestampSchema,
  endedAt: IsoTimestampSchema.optional(),
  wordsRead: z.number().int().nonnegative().default(0),
  wpm: z.number().positive().optional(),
  position: ReaderPositionSchema.optional(),
});
export type ReadingSession = z.infer<typeof ReadingSessionSchema>;
