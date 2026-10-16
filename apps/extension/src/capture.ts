export const GET_PAGE = 'LOCKED_IN_GET_PAGE';
export const CAPTURE_PAGE = 'LOCKED_IN_CAPTURE';
export const PING = 'LOCKED_IN_PING';

export interface PageCapture {
  url: string;
  title: string;
  html: string;
  selection: string;
}

export function chosenSelection(stored: unknown, pageSelection: unknown): string {
  const fromStore = typeof stored === 'string' ? stored.trim() : '';
  if (fromStore) return fromStore;
  return typeof pageSelection === 'string' ? pageSelection.trim() : '';
}

export function hasReadableText(blocks: Array<{ text?: string }>): boolean {
  return blocks.some((block) => Boolean(block.text?.trim()));
}

export function pageFromMessage(
  message: { type?: string; selection?: string } | null | undefined,
  read: (selection?: string) => PageCapture,
): PageCapture | undefined {
  if (message?.type !== GET_PAGE && message?.type !== CAPTURE_PAGE) return undefined;
  return read(message.selection);
}

export function pingReply(
  message: { type?: string } | null | undefined,
): { ok: true; worker: 'event-driven' } | undefined {
  if (message?.type !== PING) return undefined;
  return { ok: true, worker: 'event-driven' };
}

export async function activeTabId(
  query: (info: {
    active: true;
    currentWindow?: true;
    lastFocusedWindow?: true;
  }) => Promise<Array<{ id?: number }>>,
): Promise<number | undefined> {
  const [current] = await query({ active: true, currentWindow: true });
  if (current?.id !== undefined) return current.id;
  const [focused] = await query({ active: true, lastFocusedWindow: true });
  return focused?.id;
}

export async function requestPageFromTab(
  tabId: number | undefined,
  io: {
    send: (tabId: number) => Promise<PageCapture | undefined>;
    inject: (tabId: number) => Promise<PageCapture | undefined>;
  },
): Promise<PageCapture | undefined> {
  if (tabId === undefined) return undefined;
  try {
    const page = await io.send(tabId);
    if (page?.html) return page;
  } catch {
    // The content script is not on this tab.
  }
  return io.inject(tabId);
}

function shareInFlight<T>(slot: { current?: Promise<T> }, run: () => Promise<T>): Promise<T> {
  if (slot.current) return slot.current;
  const promise = run().finally(() => {
    if (slot.current === promise) slot.current = undefined;
  });
  slot.current = promise;
  return promise;
}

export function takePendingSelection(
  slot: { current?: Promise<string> },
  read: () => Promise<unknown>,
  clear: () => Promise<void>,
): Promise<string> {
  return shareInFlight(slot, async () => {
    const stored = await read();
    const pending =
      stored && typeof stored === 'object' && 'pendingSelection' in stored
        ? (stored as { pendingSelection: unknown }).pendingSelection
        : undefined;
    const selection = chosenSelection(pending, '');
    await clear();
    return selection;
  });
}

export function panelStatus(input: {
  html: string | undefined;
  readable: boolean;
  selection: string;
  wordCount: number;
}): string {
  if (!input.html) return 'This tab cannot be read. Open an http or https page and try again.';
  if (!input.readable) return 'This page has no readable text.';
  if (input.selection) return 'Selection';
  return `${input.wordCount.toLocaleString()} words`;
}
