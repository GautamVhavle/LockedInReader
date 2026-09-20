export const STORAGE_SCHEMA_VERSION = 1;

export const STORE_NAMES = [
  'documents',
  'collections',
  'tags',
  'highlights',
  'notes',
  'bookmarks',
  'progress',
  'sessions',
  'settings',
  'presets',
  'sync-log',
  'audio',
  'meta',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

export interface StorageAdapter {
  readonly name: string;
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  set<T>(store: StoreName, key: string, value: T): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  list<T>(store: StoreName): Promise<T[]>;
  transaction<T>(fn: (tx: StorageAdapter) => Promise<T>): Promise<T>;
}
