import { z } from 'zod';
import { DocumentIdSchema } from './ids.js';
import { DocumentLocationSchema } from './location.js';

export const AICitationSchema = z.object({
  documentId: DocumentIdSchema,
  title: z.string(),
  location: DocumentLocationSchema.optional(),
  excerpt: z.string(),
});
export type AICitation = z.infer<typeof AICitationSchema>;

export const AIAnswerSchema = z.object({
  text: z.string(),
  citations: z.array(AICitationSchema).default([]),
  provider: z.string(),
  model: z.string().optional(),
  grounded: z.boolean(),
  retrievedContext: z.array(z.string()).default([]),
});
export type AIAnswer = z.infer<typeof AIAnswerSchema>;

export const KnowledgeScopeSchema = z.enum([
  'paragraph',
  'document',
  'book',
  'collection',
  'library',
]);
export type KnowledgeScope = z.infer<typeof KnowledgeScopeSchema>;
