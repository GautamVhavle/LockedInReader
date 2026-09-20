import { z } from 'zod';

export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

export const IsoTimestampSchema = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), { message: 'Invalid ISO timestamp' });
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;

export const DocumentIdSchema = UuidSchema.brand<'DocumentId'>();
export type DocumentId = z.infer<typeof DocumentIdSchema>;

export const BlockIdSchema = UuidSchema.brand<'BlockId'>();
export type BlockId = z.infer<typeof BlockIdSchema>;

export const AssetIdSchema = UuidSchema.brand<'AssetId'>();
export type AssetId = z.infer<typeof AssetIdSchema>;

export const UserIdSchema = UuidSchema.brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

export const CollectionIdSchema = UuidSchema.brand<'CollectionId'>();
export type CollectionId = z.infer<typeof CollectionIdSchema>;

export const TagIdSchema = UuidSchema.brand<'TagId'>();
export type TagId = z.infer<typeof TagIdSchema>;

export const HighlightIdSchema = UuidSchema.brand<'HighlightId'>();
export type HighlightId = z.infer<typeof HighlightIdSchema>;

export const NoteIdSchema = UuidSchema.brand<'NoteId'>();
export type NoteId = z.infer<typeof NoteIdSchema>;

export const BookmarkIdSchema = UuidSchema.brand<'BookmarkId'>();
export type BookmarkId = z.infer<typeof BookmarkIdSchema>;

export const SessionIdSchema = UuidSchema.brand<'SessionId'>();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const AudioDocumentIdSchema = UuidSchema.brand<'AudioDocumentId'>();
export type AudioDocumentId = z.infer<typeof AudioDocumentIdSchema>;

export const AudioSegmentIdSchema = UuidSchema.brand<'AudioSegmentId'>();
export type AudioSegmentId = z.infer<typeof AudioSegmentIdSchema>;

export const ThemeIdSchema = UuidSchema.brand<'ThemeId'>();
export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const PresetIdSchema = UuidSchema.brand<'PresetId'>();
export type PresetId = z.infer<typeof PresetIdSchema>;

export const SyncChangeIdSchema = UuidSchema.brand<'SyncChangeId'>();
export type SyncChangeId = z.infer<typeof SyncChangeIdSchema>;

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): IsoTimestamp {
  return new Date().toISOString();
}

export function parseDocumentId(id: string): DocumentId {
  return DocumentIdSchema.parse(id);
}

export function createDocumentId(): DocumentId {
  return DocumentIdSchema.parse(createId());
}

export function createBlockId(): BlockId {
  return BlockIdSchema.parse(createId());
}

export function createAssetId(): AssetId {
  return AssetIdSchema.parse(createId());
}

export function createUserId(): UserId {
  return UserIdSchema.parse(createId());
}

export function createCollectionId(): CollectionId {
  return CollectionIdSchema.parse(createId());
}

export function createTagId(): TagId {
  return TagIdSchema.parse(createId());
}

export function createHighlightId(): HighlightId {
  return HighlightIdSchema.parse(createId());
}

export function createNoteId(): NoteId {
  return NoteIdSchema.parse(createId());
}

export function createBookmarkId(): BookmarkId {
  return BookmarkIdSchema.parse(createId());
}

export function createSessionId(): SessionId {
  return SessionIdSchema.parse(createId());
}

export function createAudioDocumentId(): AudioDocumentId {
  return AudioDocumentIdSchema.parse(createId());
}

export function createAudioSegmentId(): AudioSegmentId {
  return AudioSegmentIdSchema.parse(createId());
}

export function createThemeId(): ThemeId {
  return ThemeIdSchema.parse(createId());
}

export function createPresetId(): PresetId {
  return PresetIdSchema.parse(createId());
}

export function createSyncChangeId(): SyncChangeId {
  return SyncChangeIdSchema.parse(createId());
}
