import { countCharacters, countWords, sanitizeHref } from '@locked-in/core';
import {
  CanonicalDocumentSchema,
  createBlockId,
  createDocumentId,
  DOCUMENT_SCHEMA_VERSION,
  nowIso,
  type BlockType,
  type CanonicalDocument,
  type DocumentBlock,
  type DocumentSource,
  type TocEntry,
} from '@locked-in/types';

export interface DraftBlock {
  type: BlockType;
  text?: string;
  level?: number;
  language?: string;
  href?: string;
  alt?: string;
  listStyle?: 'ordered' | 'unordered';
}

export function buildDocument(input: {
  source: DocumentSource;
  title?: string;
  authors?: string[];
  language?: string;
  blocks: DraftBlock[];
}): CanonicalDocument {
  const id = createDocumentId();
  const now = nowIso();
  const blocks: DocumentBlock[] = input.blocks.map((block, order) => ({
    id: createBlockId(),
    type: block.type,
    text: block.text ?? '',
    order,
    level: block.level,
    language: block.language,
    href: sanitizeHref(block.href),
    alt: block.alt,
    listStyle: block.listStyle,
  }));

  const toc: TocEntry[] = blocks
    .filter((block) => block.type === 'heading')
    .map((block) => ({
      id: block.id,
      title: block.text,
      blockId: block.id,
      children: [],
    }));

  const plain = blocks.map((block) => block.text).join(' ');
  const title =
    input.title?.trim() ||
    blocks.find((block) => block.type === 'heading' && block.level === 1)?.text ||
    blocks.find((block) => block.text.trim())?.text.slice(0, 80) ||
    'Untitled';

  return CanonicalDocumentSchema.parse({
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    id,
    source: input.source,
    metadata: {
      title,
      authors: input.authors ?? [],
      language: input.language,
      wordCount: countWords(plain),
      characterCount: countCharacters(plain),
    },
    structure: {
      toc,
      spine: blocks.map((block) => block.id),
      chapterCount: toc.length || undefined,
    },
    blocks,
    assets: [],
    createdAt: now,
    updatedAt: now,
  });
}
