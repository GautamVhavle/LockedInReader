import { countCharacters, countWords, isBoilerplate, readableText, sanitizeHref } from '@locked-in/core';
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

export function presentText(type: BlockType, text: string): string {
  if (type === 'divider') return '';
  if (type === 'code' && !/<\/?[a-z][^>]*>/i.test(text)) return text;
  return readableText(text);
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
  const blocks: DocumentBlock[] = [];
  for (const block of input.blocks) {
    const text = presentText(block.type, block.text ?? '');
    if (block.type !== 'divider' && block.type !== 'code' && isBoilerplate(text)) continue;
    if (block.type !== 'divider' && !text.trim()) continue;
    blocks.push({
      id: createBlockId(),
      type: block.type,
      text,
      order: blocks.length,
      level: block.level,
      language: block.language,
      href: sanitizeHref(block.href),
      alt: block.alt ? readableText(block.alt) : block.alt,
      listStyle: block.listStyle,
    });
  }

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
    readableText(input.title ?? '') ||
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

/** shortcut: marks saved against the old tagged text can land on the wrong span until they are made again */
export function cleanDocument(document: CanonicalDocument): CanonicalDocument {
  const blocks = document.blocks.map((block) => {
    const text = presentText(block.type, block.text);
    const hide = block.type !== 'divider' && block.type !== 'code' && isBoilerplate(text);
    return {
      ...block,
      text: hide ? '' : text,
      alt: block.alt ? readableText(block.alt) : block.alt,
    };
  });
  const plain = blocks.map((block) => block.text).join(' ');
  return {
    ...document,
    metadata: {
      ...document.metadata,
      title: readableText(document.metadata.title) || document.metadata.title,
      wordCount: countWords(plain),
      characterCount: countCharacters(plain),
    },
    structure: {
      ...document.structure,
      toc: document.structure.toc
        .map((entry) => ({ ...entry, title: readableText(entry.title) }))
        .filter((entry) => entry.title.trim()),
    },
    blocks,
  };
}
