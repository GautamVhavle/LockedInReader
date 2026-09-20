import { describe, expect, it } from 'vitest';
import {
  CanonicalDocumentSchema,
  createBlockId,
  createDocumentId,
  DOCUMENT_SCHEMA_VERSION,
  DocumentLocationSchema,
  nowIso,
} from './index.js';

describe('CanonicalDocument', () => {
  it('round-trips a valid document', () => {
    const id = createDocumentId();
    const blockId = createBlockId();
    const now = nowIso();
    const document = CanonicalDocumentSchema.parse({
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      id,
      source: { kind: 'markdown', filename: 'note.md' },
      metadata: { title: 'Note', authors: [], wordCount: 2, characterCount: 11 },
      structure: { toc: [], spine: [blockId] },
      blocks: [{ id: blockId, type: 'paragraph', text: 'Hello world', order: 0 }],
      assets: [],
      createdAt: now,
      updatedAt: now,
    });

    const json = JSON.parse(JSON.stringify(document)) as unknown;
    expect(CanonicalDocumentSchema.parse(json).id).toBe(id);
  });

  it('rejects unknown schema versions', () => {
    expect(() =>
      CanonicalDocumentSchema.parse({
        schemaVersion: 99,
        id: createDocumentId(),
        source: { kind: 'txt' },
        metadata: { title: 'x' },
        structure: {},
        blocks: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
    ).toThrow();
  });
});

describe('DocumentLocation', () => {
  it('rejects inverted offsets', () => {
    const documentId = createDocumentId();
    const blockId = createBlockId();
    expect(() =>
      DocumentLocationSchema.parse({
        documentId,
        blockId,
        startOffset: 8,
        endOffset: 2,
      }),
    ).toThrow();
  });

  it('accepts a caret (zero-width) location', () => {
    const location = DocumentLocationSchema.parse({
      documentId: createDocumentId(),
      blockId: createBlockId(),
      startOffset: 4,
      endOffset: 4,
    });
    expect(location.startOffset).toBe(4);
  });
});
