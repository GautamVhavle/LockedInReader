import { z } from 'zod';
import { BlockIdSchema, DocumentIdSchema } from './ids.js';

/**
 * Stable document location. Annotations and progress MUST use this
 * instead of DOM coordinates or ephemeral renderer state.
 */
export const DocumentLocationSchema = z
  .object({
    documentId: DocumentIdSchema,
    blockId: BlockIdSchema,
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int().nonnegative(),
  })
  .refine((value) => value.endOffset >= value.startOffset, {
    message: 'endOffset must be >= startOffset',
    path: ['endOffset'],
  });

export type DocumentLocation = z.infer<typeof DocumentLocationSchema>;

export const ReaderPositionSchema = z.object({
  documentId: DocumentIdSchema,
  blockId: BlockIdSchema,
  offset: z.number().int().nonnegative(),
  wordIndex: z.number().int().nonnegative().optional(),
});

export type ReaderPosition = z.infer<typeof ReaderPositionSchema>;
