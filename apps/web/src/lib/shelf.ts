export const SHELF_FILENAMES = [
  'on-keeping-a-sentence.md',
  'how-a-page-becomes-a-document.html',
  'pocket-checklist.txt',
  'the-quiet-margin.epub',
] as const;

export function pendingShelfFilenames(
  existing: Iterable<string | undefined | null>,
): string[] {
  const names = new Set(existing);
  return SHELF_FILENAMES.filter((name) => !names.has(name));
}

export async function seedMissing(
  existingFilenames: Iterable<string | undefined | null>,
  alreadyMarked: boolean,
  ingest: (filename: string) => Promise<void>,
  mark: () => void,
): Promise<boolean> {
  if (alreadyMarked) return false;
  const pending = pendingShelfFilenames(existingFilenames);
  for (const filename of pending) await ingest(filename);
  mark();
  return pending.length > 0;
}

export async function listAfterSeed<T>(
  list: () => Promise<T[]>,
  seed: (existing: T[]) => Promise<unknown>,
): Promise<T[]> {
  const existing = await list();
  try {
    await seed(existing);
  } catch {
    // A failed sample stays retryable and must not hide the shelf.
  }
  return list();
}

export function shareInFlight<T>(
  slot: { current?: Promise<T> },
  run: () => Promise<T>,
): Promise<T> {
  if (slot.current) return slot.current;
  const promise = run().finally(() => {
    if (slot.current === promise) slot.current = undefined;
  });
  slot.current = promise;
  return promise;
}
