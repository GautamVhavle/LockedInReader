import { describe, expect, it, vi } from 'vitest';
import {
  CAPTURE_PAGE,
  chosenSelection,
  GET_PAGE,
  hasReadableText,
  pageFromMessage,
  panelStatus,
  PING,
  pingReply,
  activeTabId,
  requestPageFromTab,
  takePendingSelection,
} from './capture.js';

describe('page capture', () => {
  it('answers the page messages the panel sends and ignores anything else', () => {
    const read = vi.fn((selection?: string) => ({
      url: 'https://example.com',
      title: 'Example',
      html: '<p>Hi</p>',
      selection: selection ?? '',
    }));
    expect(pageFromMessage({ type: GET_PAGE }, read)?.html).toBe('<p>Hi</p>');
    expect(pageFromMessage({ type: CAPTURE_PAGE, selection: 'Hi' }, read)?.selection).toBe('Hi');
    expect(pageFromMessage({ type: PING }, read)).toBeUndefined();
    expect(pageFromMessage(undefined, read)).toBeUndefined();
    expect(pingReply({ type: PING })).toEqual({ ok: true, worker: 'event-driven' });
    expect(pingReply({ type: GET_PAGE })).toBeUndefined();
  });

  it('prefers a stored selection and otherwise uses the highlighted text', () => {
    expect(chosenSelection('  Keep this.  ', 'Other words')).toBe('Keep this.');
    expect(chosenSelection('   ', 'Other words')).toBe('Other words');
    expect(chosenSelection(undefined, '  ')).toBe('');
  });

  it('reads a stored selection once when the panel starts twice', async () => {
    const slot: { current?: Promise<string> } = {};
    let reads = 0;
    let clears = 0;
    const read = async () => {
      reads += 1;
      return { pendingSelection: '  Just this sentence.  ' };
    };
    const clear = async () => {
      clears += 1;
    };
    const [first, second] = await Promise.all([
      takePendingSelection(slot, read, clear),
      takePendingSelection(slot, read, clear),
    ]);
    expect(first).toBe('Just this sentence.');
    expect(second).toBe(first);
    expect(reads).toBe(1);
    expect(clears).toBe(1);
  });

  it('reads the focused window when the side panel has no current window', async () => {
    const query = vi.fn(async (info: { currentWindow?: boolean; lastFocusedWindow?: boolean }) => {
      if (info.currentWindow) return [];
      return [{ id: 7 }];
    });
    await expect(activeTabId(query)).resolves.toBe(7);
    expect(query).toHaveBeenCalledTimes(2);

    const current = vi.fn(async () => [{ id: 3 }]);
    await expect(activeTabId(current)).resolves.toBe(3);
    expect(current).toHaveBeenCalledOnce();
  });

  it('falls through to an injected read when the content script is missing', async () => {
    const send = vi.fn(async () => {
      throw new Error('Receiving end does not exist');
    });
    const inject = vi.fn(async () => ({
      url: 'https://example.com/story',
      title: 'Story',
      html: '<article><p>Story</p></article>',
      selection: '',
    }));
    const page = await requestPageFromTab(4, { send, inject });
    expect(page?.html).toContain('Story');
    expect(send).toHaveBeenCalledOnce();
    expect(inject).toHaveBeenCalledOnce();
    expect(await requestPageFromTab(undefined, { send, inject })).toBeUndefined();
    expect(inject).toHaveBeenCalledOnce();
  });

  it('does not inject when the content script already returned html', async () => {
    const send = vi.fn(async () => ({
      url: 'https://example.com',
      title: 'Example',
      html: '<p>Hi</p>',
      selection: 'Hi',
    }));
    const inject = vi.fn();
    const page = await requestPageFromTab(2, { send, inject });
    expect(page?.selection).toBe('Hi');
    expect(inject).not.toHaveBeenCalled();
  });

  it('treats a page with no text as unreadable', () => {
    expect(hasReadableText([{ text: '' }, { text: '   ' }])).toBe(false);
    expect(hasReadableText([{ text: 'One sentence.' }])).toBe(true);
    expect(panelStatus({ html: undefined, readable: false, selection: '', wordCount: 0 })).toMatch(
      /cannot be read/,
    );
    expect(panelStatus({ html: '<nav>Home</nav>', readable: false, selection: '', wordCount: 0 })).toMatch(
      /no readable text/,
    );
    expect(
      panelStatus({ html: '<p>Hi</p>', readable: true, selection: 'Hi', wordCount: 40 }),
    ).toBe('Selection');
    expect(panelStatus({ html: '<p>Hi</p>', readable: true, selection: '', wordCount: 40 })).toBe(
      `${(40).toLocaleString()} words`,
    );
  });
});
