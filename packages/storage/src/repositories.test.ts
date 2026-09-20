import { describe, expect, it } from 'vitest';
import {
  createDocumentId,
  DOCUMENT_SCHEMA_VERSION,
  nowIso,
  type CanonicalDocument,
} from '@locked-in/types';
import { MemoryStorageAdapter } from './memory.js';
import { LocalWorkspace } from './repositories.js';

function doc(title: string): CanonicalDocument {
  const id = createDocumentId();
  const now = nowIso();
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    id,
    source: { kind: 'txt', filename: `${title}.txt` },
    metadata: { title, authors: [], wordCount: 1, characterCount: title.length },
    structure: { toc: [], spine: [] },
    blocks: [],
    assets: [],
    collectionIds: [],
    tagIds: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

describe('LocalWorkspace', () => {
  it('persists a document across a new workspace on the same adapter', async () => {
    const storage = new MemoryStorageAdapter();
    const first = new LocalWorkspace(storage);
    const document = doc('Keep me');
    await first.documents.save(document);

    const reopened = new LocalWorkspace(storage);
    const found = await reopened.documents.get(document.id);
    expect(found?.metadata.title).toBe('Keep me');
  });

  it('keeps settings without an account', async () => {
    const workspace = new LocalWorkspace(new MemoryStorageAdapter());
    await workspace.settings.save({
      ...(await workspace.settings.get()),
      wpm: 600,
    });
    expect((await workspace.settings.get()).wpm).toBe(600);
  });
});
