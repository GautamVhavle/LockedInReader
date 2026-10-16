import { DocumentEngine } from '@locked-in/document-engine';
import { epubParser } from '@locked-in/epub';
import { webParser } from '@locked-in/extraction';
import { saveProgress } from '@locked-in/library';
import { pdfParser } from '@locked-in/pdf';
import {
  IndexedDbStorageAdapter,
  LocalWorkspace,
  MemoryStorageAdapter,
  type StorageAdapter,
  type StoreName,
} from '@locked-in/storage';
import type { CanonicalDocument } from '@locked-in/types';
import quietUrl from '../samples/quiet-margin.epub?url';
import { seedMissing, shareInFlight } from './shelf.js';
import welcome from './welcome.md?raw';

const articleHtml = `<!doctype html><html><head><title>How a page becomes a document</title></head><body><article><h1>How a page becomes a document</h1><p>A webpage is a performance. A document is what remains when the performance ends: the title, the paragraphs, and the place you stopped.</p><p>The chrome, the recommended next thing, and the unread badge stay outside. What you keep is the sentence.</p><h2>What the extension keeps</h2><p>Open a page, then read it here. The capture is the article, not a screenshot of the site around it.</p></article></body></html>`;

const checklist = `Pocket checklist

Open one document.
Read until a sentence is worth keeping.
Mark it.
Leave.
Continue tomorrow from the same word.
`;

export function createDocumentPlatform(): DocumentEngine {
  const engine = new DocumentEngine();
  engine.register(webParser);
  engine.register(epubParser);
  engine.register(pdfParser);
  return engine;
}

export const documentPlatform = createDocumentPlatform();

class SwitchingAdapter implements StorageAdapter {
  name = 'memory';
  private inner: StorageAdapter = new MemoryStorageAdapter();
  private connected: Promise<void> | undefined;

  connect(): Promise<void> {
    this.connected ??= this.promote();
    return this.connected;
  }

  private async promote(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const idb = new IndexedDbStorageAdapter();
    try {
      await idb.list('meta');
      this.inner = idb;
      this.name = 'indexeddb';
    } catch {
      this.inner = new MemoryStorageAdapter();
      this.name = 'memory';
    }
  }

  get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return this.inner.get(store, key);
  }
  set<T>(store: StoreName, key: string, value: T): Promise<void> {
    return this.inner.set(store, key, value);
  }
  delete(store: StoreName, key: string): Promise<void> {
    return this.inner.delete(store, key);
  }
  list<T>(store: StoreName): Promise<T[]> {
    return this.inner.list(store);
  }
  transaction<T>(fn: (tx: StorageAdapter) => Promise<T>): Promise<T> {
    return this.inner.transaction(fn);
  }
}

const switching = new SwitchingAdapter();
export const workspace = new LocalWorkspace(switching);
export const storageReady = switching.connect();

export async function ingestText(
  text: string,
  filename: string,
  title?: string,
): Promise<CanonicalDocument> {
  await storageReady;
  const document = await documentPlatform.ingest({
    text,
    filename,
    title,
  });
  await workspace.documents.save(document);
  return document;
}

export async function ingestFile(file: File): Promise<CanonicalDocument> {
  await storageReady;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text =
    file.type.startsWith('text') || /\.(md|txt|html?)$/i.test(file.name)
      ? new TextDecoder().decode(bytes)
      : undefined;
  const document = await documentPlatform.ingest({
    bytes,
    text,
    filename: file.name,
    mimeType: file.type,
  });
  await workspace.documents.save(document);
  return document;
}

export async function ingestFiles(
  files: FileList | File[],
): Promise<CanonicalDocument | undefined> {
  let last: CanonicalDocument | undefined;
  for (const file of files) {
    last = await ingestFile(file);
  }
  return last;
}

const shelfSlot: { current?: Promise<boolean> } = {};

export function seedShelfIfNeeded(existing: CanonicalDocument[]): Promise<boolean> {
  if (typeof localStorage === 'undefined') return Promise.resolve(false);
  if (localStorage.getItem('locked-in:shelf-v2') === '1') return Promise.resolve(false);
  return shareInFlight(shelfSlot, () => seedShelf(existing));
}

async function seedShelf(existing: CanonicalDocument[]): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;
  return seedMissing(
    existing.map((document) => document.source.filename),
    localStorage.getItem('locked-in:shelf-v2') === '1',
    ingestSample,
    () => {
      localStorage.setItem('locked-in:shelf-v2', '1');
      localStorage.setItem('locked-in:seeded', '1');
    },
  );
}

async function ingestSample(filename: string): Promise<void> {
  switch (filename) {
    case 'on-keeping-a-sentence.md': {
      const essay = await ingestText(welcome, filename);
      const block = essay.blocks.find((item) => item.text);
      if (block) {
        await saveProgress(
          workspace,
          essay.id,
          { documentId: essay.id, blockId: block.id, offset: 0, wordIndex: 24 },
          12,
          'orp',
        );
      }
      return;
    }
    case 'how-a-page-becomes-a-document.html':
      await ingestText(articleHtml, filename);
      return;
    case 'pocket-checklist.txt':
      await ingestText(checklist, filename, 'Pocket checklist');
      return;
    case 'the-quiet-margin.epub': {
      const response = await fetch(quietUrl);
      if (!response.ok) throw new Error('Sample book did not load');
      const bytes = new Uint8Array(await response.arrayBuffer());
      await ingestFile(new File([bytes], filename, { type: 'application/epub+zip' }));
      return;
    }
    default:
      throw new Error(`Unknown sample ${filename}`);
  }
}

export async function removeDocument(id: string): Promise<void> {
  await storageReady;
  const highlights = await workspace.annotations.listHighlights(id);
  await Promise.all(highlights.map((item) => workspace.annotations.deleteHighlight(item.id)));
  await workspace.documents.delete(id);
  await workspace.storage.delete('progress', id);
}
