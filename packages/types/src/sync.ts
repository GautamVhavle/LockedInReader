import { z } from 'zod';
import { IsoTimestampSchema, SyncChangeIdSchema, UserIdSchema } from './ids.js';

export const SyncEntityTypeSchema = z.enum([
  'document',
  'collection',
  'tag',
  'highlight',
  'note',
  'bookmark',
  'progress',
  'preset',
  'settings',
  'session',
]);
export type SyncEntityType = z.infer<typeof SyncEntityTypeSchema>;

export const SyncOpSchema = z.enum(['upsert', 'delete']);
export type SyncOp = z.infer<typeof SyncOpSchema>;

export const SyncChangeSchema = z.object({
  id: SyncChangeIdSchema,
  entityType: SyncEntityTypeSchema,
  entityId: z.string().uuid(),
  op: SyncOpSchema,
  payload: z.unknown().optional(),
  updatedAt: IsoTimestampSchema,
  origin: z.string().default('local'),
});
export type SyncChange = z.infer<typeof SyncChangeSchema>;

export const UserSchema = z.object({
  id: UserIdSchema,
  kind: z.enum(['anonymous', 'authenticated']),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: IsoTimestampSchema,
});
export type User = z.infer<typeof UserSchema>;
