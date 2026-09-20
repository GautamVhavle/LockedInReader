import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from '@locked-in/storage';
import { createId, nowIso } from '@locked-in/types';
import { enqueueChange, LocalOnlySyncAdapter, resolveConflict, SyncEngine } from './index.js';

describe('sync', () => {
  it('does not silently drop a local highlight on remote delete', () => {
    const local = enqueueChange('highlight', createId(), 'upsert', { text: 'keep' });
    const incoming = {
      ...local,
      op: 'delete' as const,
      updatedAt: new Date(Date.parse(nowIso()) + 1000).toISOString(),
    };
    expect(resolveConflict(local, incoming).op).toBe('upsert');
  });

  it('retries offline edits when flush is called', async () => {
    const remote = new LocalOnlySyncAdapter();
    const engine = new SyncEngine(new MemoryStorageAdapter(), remote);
    await engine.record(enqueueChange('note', createId(), 'upsert', { body: 'later' }));
    await engine.flush();
    const pulled = await remote.pull();
    expect(pulled).toHaveLength(1);
  });
});
