import { STORE_NAMES, type StorageAdapter, type StoreName } from './adapter.js';

export class MemoryStorageAdapter implements StorageAdapter {
  readonly name = 'memory';
  private readonly data = new Map<StoreName, Map<string, unknown>>();

  constructor() {
    for (const store of STORE_NAMES) {
      this.data.set(store, new Map());
    }
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return this.data.get(store)?.get(key) as T | undefined;
  }

  async set<T>(store: StoreName, key: string, value: T): Promise<void> {
    this.data.get(store)?.set(key, structuredClone(value));
  }

  async delete(store: StoreName, key: string): Promise<void> {
    this.data.get(store)?.delete(key);
  }

  async list<T>(store: StoreName): Promise<T[]> {
    return [...(this.data.get(store)?.values() ?? [])].map((value) =>
      structuredClone(value),
    ) as T[];
  }

  async transaction<T>(fn: (tx: StorageAdapter) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
