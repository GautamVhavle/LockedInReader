import { DocumentEngine } from '@locked-in/document-engine';
import { epubParser } from '@locked-in/epub';
import { webParser } from '@locked-in/extraction';
import { pdfParser } from '@locked-in/pdf';
import {
  IndexedDbStorageAdapter,
  LocalWorkspace,
  MemoryStorageAdapter,
  type StorageAdapter,
  type StoreName,
} from '@locked-in/storage';
import type { CanonicalDocument } from '@locked-in/types';
import welcome from './welcome.md?raw';

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

export async function ingestText(text: string, filename: string): Promise<CanonicalDocument> {
  await storageReady;
  const document = await documentPlatform.ingest({
    text,
    filename,
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

export async function ingestFiles(files: FileList | File[]): Promise<CanonicalDocument | undefined> {
  let last: CanonicalDocument | undefined;
  for (const file of files) {
    last = await ingestFile(file);
  }
  return last;
}

export async function seedWelcomeIfNeeded(existingCount: number): Promise<boolean> {
  if (existingCount > 0) return false;
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem('locked-in:seeded') === '1') return false;
  await ingestText(welcome, 'on-keeping-a-sentence.md');
  localStorage.setItem('locked-in:seeded', '1');
  return true;
}

export async function removeDocument(id: string): Promise<void> {
  await storageReady;
  const highlights = await workspace.annotations.listHighlights(id);
  await Promise.all(highlights.map((item) => workspace.annotations.deleteHighlight(item.id)));
  await workspace.documents.delete(id);
  await workspace.storage.delete('progress', id);
}
