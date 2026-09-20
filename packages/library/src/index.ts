import type { LocalWorkspace } from '@locked-in/storage';
import {
  createCollectionId,
  createSessionId,
  nowIso,
  type CanonicalDocument,
  type Collection,
  type LibraryFilter,
  type ReadingMode,
  type ReadingProgress,
  type ReadingSession,
  type ReaderPosition,
} from '@locked-in/types';

export function classifyDocument(document: CanonicalDocument): Exclude<LibraryFilter, 'all' | 'continue'> {
  if (document.archived) return 'archive';
  if (document.source.kind === 'epub') return 'books';
  if (document.source.kind === 'pdf') return 'papers';
  if (document.source.kind === 'web' || document.source.kind === 'html') return 'articles';
  return 'inbox';
}

export function filterLibrary(
  documents: CanonicalDocument[],
  progress: ReadingProgress[],
  filter: LibraryFilter,
): CanonicalDocument[] {
  const progressById = new Map(progress.map((item) => [item.documentId, item]));
  switch (filter) {
    case 'all':
      return documents.filter((doc) => !doc.archived);
    case 'continue':
      return documents.filter((doc) => {
        const item = progressById.get(doc.id);
        return item && item.percent > 0 && item.percent < 100 && !doc.archived;
      });
    case 'archive':
      return documents.filter((doc) => doc.archived);
    default:
      return documents.filter((doc) => classifyDocument(doc) === filter);
  }
}

export async function startSession(
  workspace: LocalWorkspace,
  documentId: CanonicalDocument['id'],
  mode: ReadingMode,
): Promise<ReadingSession> {
  const session: ReadingSession = {
    id: createSessionId(),
    documentId,
    mode,
    startedAt: nowIso(),
    wordsRead: 0,
  };
  await workspace.sessions.save(session);
  return session;
}

export async function saveProgress(
  workspace: LocalWorkspace,
  documentId: CanonicalDocument['id'],
  position: ReaderPosition,
  percent: number,
  mode: ReadingMode,
  wordsRead = 0,
): Promise<ReadingProgress> {
  const progress: ReadingProgress = {
    documentId,
    position,
    percent,
    wordsRead,
    lastMode: mode,
    updatedAt: nowIso(),
  };
  await workspace.progress.save(progress);
  return progress;
}

export async function createCollection(
  workspace: LocalWorkspace,
  name: string,
): Promise<Collection> {
  const now = nowIso();
  const collection: Collection = {
    id: createCollectionId(),
    name,
    documentIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await workspace.library.saveCollection(collection);
  return collection;
}
