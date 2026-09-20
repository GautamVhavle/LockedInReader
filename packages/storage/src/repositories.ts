import {
  AppSettingsSchema,
  CanonicalDocumentSchema,
  DEFAULT_SETTINGS,
  type AppSettings,
  type Bookmark,
  type CanonicalDocument,
  type Collection,
  type Highlight,
  type Note,
  type ReadingProgress,
  type ReadingSession,
  type Tag,
} from '@locked-in/types';
import type { StorageAdapter } from './adapter.js';

export class DocumentRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async save(document: CanonicalDocument): Promise<void> {
    const parsed = CanonicalDocumentSchema.parse(document);
    await this.storage.set('documents', parsed.id, parsed);
  }

  async get(id: string): Promise<CanonicalDocument | undefined> {
    const value = await this.storage.get<unknown>('documents', id);
    if (value === undefined) return undefined;
    const parsed = CanonicalDocumentSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }

  async list(): Promise<CanonicalDocument[]> {
    const all = await this.storage.list<unknown>('documents');
    return all.flatMap((item) => {
      const parsed = CanonicalDocumentSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete('documents', id);
  }
}

export class LibraryRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async saveCollection(collection: Collection): Promise<void> {
    await this.storage.set('collections', collection.id, collection);
  }

  async listCollections(): Promise<Collection[]> {
    return this.storage.list<Collection>('collections');
  }

  async saveTag(tag: Tag): Promise<void> {
    await this.storage.set('tags', tag.id, tag);
  }

  async listTags(): Promise<Tag[]> {
    return this.storage.list<Tag>('tags');
  }
}

export class AnnotationRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async saveHighlight(highlight: Highlight): Promise<void> {
    await this.storage.set('highlights', highlight.id, highlight);
  }

  async listHighlights(documentId?: string): Promise<Highlight[]> {
    const all = await this.storage.list<Highlight>('highlights');
    return documentId ? all.filter((item) => item.documentId === documentId) : all;
  }

  async deleteHighlight(id: string): Promise<void> {
    await this.storage.delete('highlights', id);
  }

  async saveNote(note: Note): Promise<void> {
    await this.storage.set('notes', note.id, note);
  }

  async listNotes(): Promise<Note[]> {
    return this.storage.list<Note>('notes');
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    await this.storage.set('bookmarks', bookmark.id, bookmark);
  }

  async listBookmarks(documentId?: string): Promise<Bookmark[]> {
    const all = await this.storage.list<Bookmark>('bookmarks');
    return documentId ? all.filter((item) => item.documentId === documentId) : all;
  }
}

export class ProgressRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async save(progress: ReadingProgress): Promise<void> {
    await this.storage.set('progress', progress.documentId, progress);
  }

  async get(documentId: string): Promise<ReadingProgress | undefined> {
    return this.storage.get<ReadingProgress>('progress', documentId);
  }

  async list(): Promise<ReadingProgress[]> {
    return this.storage.list<ReadingProgress>('progress');
  }
}

export class SessionRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async save(session: ReadingSession): Promise<void> {
    await this.storage.set('sessions', session.id, session);
  }

  async list(documentId?: string): Promise<ReadingSession[]> {
    const all = await this.storage.list<ReadingSession>('sessions');
    return documentId ? all.filter((item) => item.documentId === documentId) : all;
  }
}

export class SettingsRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async get(): Promise<AppSettings> {
    const value = await this.storage.get<unknown>('settings', 'app');
    const parsed = AppSettingsSchema.safeParse(value ?? {});
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  }

  async save(settings: AppSettings): Promise<void> {
    await this.storage.set('settings', 'app', AppSettingsSchema.parse(settings));
  }
}

export class LocalWorkspace {
  readonly documents: DocumentRepository;
  readonly library: LibraryRepository;
  readonly annotations: AnnotationRepository;
  readonly progress: ProgressRepository;
  readonly sessions: SessionRepository;
  readonly settings: SettingsRepository;

  constructor(readonly storage: StorageAdapter) {
    this.documents = new DocumentRepository(storage);
    this.library = new LibraryRepository(storage);
    this.annotations = new AnnotationRepository(storage);
    this.progress = new ProgressRepository(storage);
    this.sessions = new SessionRepository(storage);
    this.settings = new SettingsRepository(storage);
  }
}
