import type { StorageAdapter } from '@locked-in/storage';
import {
  createSyncChangeId,
  nowIso,
  type SyncChange,
  type SyncEntityType,
  type SyncOp,
} from '@locked-in/types';

export interface SyncAdapter {
  push(changes: SyncChange[]): Promise<void>;
  pull(since?: string): Promise<SyncChange[]>;
}

export class LocalOnlySyncAdapter implements SyncAdapter {
  constructor(private readonly remote: SyncChange[] = []) {}
  async push(changes: SyncChange[]): Promise<void> {
    this.remote.push(...changes);
  }
  async pull(since?: string): Promise<SyncChange[]> {
    if (!since) return [...this.remote];
    const sinceMs = Date.parse(since);
    return this.remote.filter((change) => Date.parse(change.updatedAt) > sinceMs);
  }
}

export function enqueueChange(
  entityType: SyncEntityType,
  entityId: string,
  op: SyncOp,
  payload?: unknown,
): SyncChange {
  return {
    id: createSyncChangeId(),
    entityType,
    entityId,
    op,
    payload,
    updatedAt: nowIso(),
    origin: 'local',
  };
}

export function resolveConflict(local: SyncChange, incoming: SyncChange): SyncChange {
  if (local.entityType === 'highlight' || local.entityType === 'note') {
    if (local.op === 'delete' && incoming.op === 'upsert') return incoming;
    if (incoming.op === 'delete' && local.op === 'upsert') return local;
  }
  return Date.parse(incoming.updatedAt) >= Date.parse(local.updatedAt) ? incoming : local;
}

export class SyncEngine {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly adapter: SyncAdapter,
  ) {}

  async record(change: SyncChange): Promise<void> {
    await this.storage.set('sync-log', change.id, change);
  }

  async flush(): Promise<void> {
    const pending = await this.storage.list<SyncChange>('sync-log');
    if (pending.length === 0) return;
    await this.adapter.push(pending);
  }

  async pullAndMerge(since?: string): Promise<SyncChange[]> {
    const incoming = await this.adapter.pull(since);
    const local = await this.storage.list<SyncChange>('sync-log');
    const localByEntity = new Map(local.map((change) => [change.entityId, change]));
    const applied: SyncChange[] = [];
    for (const change of incoming) {
      const existing = localByEntity.get(change.entityId);
      const winner = existing ? resolveConflict(existing, change) : change;
      await this.storage.set('sync-log', winner.id, winner);
      applied.push(winner);
    }
    return applied;
  }
}
