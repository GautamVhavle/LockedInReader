import { describe, expect, it } from 'vitest';
import {
  listAfterSeed,
  pendingShelfFilenames,
  seedMissing,
  shareInFlight,
  SHELF_FILENAMES,
} from './shelf.js';

describe('sample shelf', () => {
  it('seeds only the sample files that are not already on the shelf', () => {
    expect(pendingShelfFilenames([])).toEqual([...SHELF_FILENAMES]);
    expect(
      pendingShelfFilenames(['pocket-checklist.txt', undefined, 'notes.md']),
    ).not.toContain('pocket-checklist.txt');
    expect(pendingShelfFilenames(SHELF_FILENAMES)).toEqual([]);
  });

  it('does not mark the shelf seeded when a sample fails', async () => {
    const ingested: string[] = [];
    let marked = false;
    await expect(
      seedMissing(
        ['on-keeping-a-sentence.md'],
        false,
        async (filename) => {
          ingested.push(filename);
          if (filename === 'the-quiet-margin.epub') throw new Error('Sample book did not load');
        },
        () => {
          marked = true;
        },
      ),
    ).rejects.toThrow('Sample book did not load');
    expect(ingested).not.toContain('on-keeping-a-sentence.md');
    expect(ingested).toContain('the-quiet-margin.epub');
    expect(marked).toBe(false);
  });

  it('marks the shelf once every missing sample has been ingested', async () => {
    const ingested: string[] = [];
    let marked = 0;
    const seeded = await seedMissing(
      [],
      false,
      async (filename) => {
        ingested.push(filename);
      },
      () => {
        marked += 1;
      },
    );
    expect(seeded).toBe(true);
    expect(ingested).toEqual([...SHELF_FILENAMES]);
    expect(marked).toBe(1);
  });

  it('does not ingest again after the shelf is marked', async () => {
    let ingested = 0;
    let marked = 0;
    const seeded = await seedMissing(
      [],
      true,
      async () => {
        ingested += 1;
      },
      () => {
        marked += 1;
      },
    );
    expect(seeded).toBe(false);
    expect(ingested).toBe(0);
    expect(marked).toBe(0);
  });

  it('still lists documents when seeding throws', async () => {
    let calls = 0;
    const documents = await listAfterSeed(
      async () => {
        calls += 1;
        return calls === 1 ? ['essay'] : ['essay', 'checklist'];
      },
      async () => {
        throw new Error('Sample book did not load');
      },
    );
    expect(documents).toEqual(['essay', 'checklist']);
  });

  it('shares one in-flight seed and allows a retry after it fails', async () => {
    const slot: { current?: Promise<number> } = {};
    let runs = 0;
    const first = shareInFlight(slot, async () => {
      runs += 1;
      throw new Error('fail');
    });
    const second = shareInFlight(slot, async () => {
      runs += 1;
      return 2;
    });
    await expect(first).rejects.toThrow('fail');
    await expect(second).rejects.toThrow('fail');
    expect(runs).toBe(1);
    await expect(
      shareInFlight(slot, async () => {
        runs += 1;
        return 2;
      }),
    ).resolves.toBe(2);
    expect(runs).toBe(2);
  });
});
