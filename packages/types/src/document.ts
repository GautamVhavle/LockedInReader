import { z } from 'zod';
import {
  AssetIdSchema,
  BlockIdSchema,
  CollectionIdSchema,
  DocumentIdSchema,
  IsoTimestampSchema,
  TagIdSchema,
} from './ids.js';

export const DOCUMENT_SCHEMA_VERSION = 1 as const;

export const DocumentSourceKindSchema = z.enum([
  'web',
  'epub',
  'pdf',
  'html',
  'markdown',
  'txt',
  'docx',
  'manual',
]);
export type DocumentSourceKind = z.infer<typeof DocumentSourceKindSchema>;

export const DocumentSourceSchema = z.object({
  kind: DocumentSourceKindSchema,
  url: z.string().optional(),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  capturedAt: IsoTimestampSchema.optional(),
  originalTitle: z.string().optional(),
  siteName: z.string().optional(),
  checksum: z.string().optional(),
});
export type DocumentSource = z.infer<typeof DocumentSourceSchema>;

export const DocumentMetadataSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  language: z.string().optional(),
  description: z.string().optional(),
  publishedAt: IsoTimestampSchema.optional(),
  publisher: z.string().optional(),
  wordCount: z.number().int().nonnegative().default(0),
  characterCount: z.number().int().nonnegative().default(0),
  pageCount: z.number().int().nonnegative().optional(),
  identifier: z.string().optional(),
  coverAssetId: AssetIdSchema.optional(),
});
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export type TocEntry = {
  id: string;
  title: string;
  blockId?: string;
  href?: string;
  children?: TocEntry[];
};

export const TocEntrySchema: z.ZodType<TocEntry> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    blockId: z.string().uuid().optional(),
    href: z.string().optional(),
    children: z.array(TocEntrySchema).optional(),
  }),
);

export const DocumentStructureSchema = z.object({
  toc: z.array(TocEntrySchema).default([] as TocEntry[]),
  spine: z.array(BlockIdSchema).default([]),
  chapterCount: z.number().int().nonnegative().optional(),
});
export type DocumentStructure = z.infer<typeof DocumentStructureSchema>;

export const BlockTypeSchema = z.enum([
  'heading',
  'paragraph',
  'quote',
  'list',
  'list-item',
  'code',
  'image',
  'table',
  'divider',
  'footnote',
  'caption',
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const DocumentBlockSchema = z.object({
  id: BlockIdSchema,
  type: BlockTypeSchema,
  text: z.string().default(''),
  order: z.number().int().nonnegative(),
  level: z.number().int().min(1).max(6).optional(),
  parentId: BlockIdSchema.optional(),
  href: z.string().optional(),
  language: z.string().optional(),
  alt: z.string().optional(),
  assetId: AssetIdSchema.optional(),
  listStyle: z.enum(['ordered', 'unordered']).optional(),
  rows: z.array(z.array(z.string())).optional(),
  attrs: z.record(z.string()).optional(),
});
export type DocumentBlock = z.infer<typeof DocumentBlockSchema>;

export const DocumentAssetKindSchema = z.enum(['image', 'font', 'stylesheet', 'audio', 'file']);
export type DocumentAssetKind = z.infer<typeof DocumentAssetKindSchema>;

export const DocumentAssetSchema = z.object({
  id: AssetIdSchema,
  kind: DocumentAssetKindSchema,
  mimeType: z.string(),
  filename: z.string().optional(),
  href: z.string().optional(),
  dataUrl: z.string().optional(),
  byteLength: z.number().int().nonnegative().optional(),
});
export type DocumentAsset = z.infer<typeof DocumentAssetSchema>;

export const CanonicalDocumentSchema = z.object({
  schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
  id: DocumentIdSchema,
  source: DocumentSourceSchema,
  metadata: DocumentMetadataSchema,
  structure: DocumentStructureSchema,
  blocks: z.array(DocumentBlockSchema),
  assets: z.array(DocumentAssetSchema).default([]),
  collectionIds: z.array(CollectionIdSchema).default([]),
  tagIds: z.array(TagIdSchema).default([]),
  archived: z.boolean().default(false),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type CanonicalDocument = z.infer<typeof CanonicalDocumentSchema>;

/** Alias used throughout the product: everything is a Document. */
export type Document = CanonicalDocument;
export const DocumentSchema = CanonicalDocumentSchema;

export const LibraryFilterSchema = z.enum([
  'inbox',
  'continue',
  'books',
  'articles',
  'papers',
  'archive',
  'all',
]);
export type LibraryFilter = z.infer<typeof LibraryFilterSchema>;
