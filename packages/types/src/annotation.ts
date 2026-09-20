import { z } from 'zod';
import {
  CollectionIdSchema,
  DocumentIdSchema,
  HighlightIdSchema,
  IsoTimestampSchema,
  NoteIdSchema,
} from './ids.js';
import { DocumentLocationSchema } from './location.js';

export const HighlightColorSchema = z.enum(['yellow', 'green', 'blue', 'pink', 'orange']);
export type HighlightColor = z.infer<typeof HighlightColorSchema>;

export const HighlightSchema = z.object({
  id: HighlightIdSchema,
  documentId: DocumentIdSchema,
  location: DocumentLocationSchema,
  text: z.string(),
  color: HighlightColorSchema.default('yellow'),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const NoteTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('document'), documentId: DocumentIdSchema }),
  z.object({ kind: z.literal('highlight'), highlightId: HighlightIdSchema }),
  z.object({ kind: z.literal('collection'), collectionId: CollectionIdSchema }),
]);
export type NoteTarget = z.infer<typeof NoteTargetSchema>;

export const NoteSchema = z.object({
  id: NoteIdSchema,
  target: NoteTargetSchema,
  body: z.string().min(1),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type Note = z.infer<typeof NoteSchema>;
