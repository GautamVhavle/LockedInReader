import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { createHighlightId } from '@locked-in/types';
import { LibrarySearch } from './index.js';

describe('LibrarySearch', () => {
  it('finds title, body, and highlight text', () => {
    const document = sampleDocument();
    const search = new LibrarySearch();
    search.ingest({
      documents: [document],
      highlights: [
        {
          id: createHighlightId(),
          documentId: document.id,
          location: {
            documentId: document.id,
            blockId: document.blocks[0]!.id,
            startOffset: 0,
            endOffset: 6,
          },
          text: 'agent memory notes',
          color: 'yellow',
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      ],
    });
    expect(search.search('Locked').length).toBeGreaterThan(0);
    expect(search.search('Remember').length).toBeGreaterThan(0);
    expect(search.search('agent memory').some((hit) => hit.kind === 'highlight')).toBe(true);
  });
});
