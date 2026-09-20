import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { MemoryStorageAdapter, LocalWorkspace } from '@locked-in/storage';
import { AnnotationService, createHighlight } from './index.js';

describe('annotations', () => {
  it('stores highlights against canonical offsets', async () => {
    const document = sampleDocument();
    const block = document.blocks[1] ?? document.blocks[0]!;
    const highlight = createHighlight(document, {
      documentId: document.id,
      blockId: block.id,
      startOffset: 0,
      endOffset: 11,
    });
    expect(highlight.text).toBe(block.text.slice(0, 11));

    const workspace = new LocalWorkspace(new MemoryStorageAdapter());
    const service = new AnnotationService(workspace.annotations);
    await service.highlight(document, highlight.location);
    const listed = await workspace.annotations.listHighlights(document.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.location.blockId).toBe(block.id);
  });
});
