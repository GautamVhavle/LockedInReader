import { openDB, type IDBPDatabase } from 'idb';
import {
  STORAGE_SCHEMA_VERSION,
  STORE_NAMES,
  type StorageAdapter,
  type StoreName,
} from './adapter.js';

const DB_NAME = 'locked-in';

export class IndexedDbStorageAdapter implements StorageAdapter {
  readonly name = 'indexeddb';
  private db: IDBPDatabase | undefined;

  private async open(): Promise<IDBPDatabase> {
    if (this.db) return this.db;
    const opening = openDB(DB_NAME, STORAGE_SCHEMA_VERSION, {
      upgrade(db, oldVersion) {
        for (const store of STORE_NAMES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        }
        if (oldVersion > 0 && oldVersion < STORAGE_SCHEMA_VERSION) {
          // Future migrations land here. Never drop user stores blindly.
        }
      },
    });
    this.db = await Promise.race([
      opening,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('IndexedDB timed out')), 2500);
      }),
    ]);
    return this.db;
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    const db = await this.open();
    return (await db.get(store, key)) as T | undefined;
  }

  async set<T>(store: StoreName, key: string, value: T): Promise<void> {
    const db = await this.open();
    await db.put(store, value, key);
  }

  async delete(store: StoreName, key: string): Promise<void> {
    const db = await this.open();
    await db.delete(store, key);
  }

  async list<T>(store: StoreName): Promise<T[]> {
    const db = await this.open();
    return (await db.getAll(store)) as T[];
  }

  async transaction<T>(fn: (tx: StorageAdapter) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
