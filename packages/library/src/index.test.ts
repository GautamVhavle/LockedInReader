import { describe, expect, it } from 'vitest';
import { sampleDocument } from '@locked-in/testing';
import { classifyDocument, filterLibrary } from './index.js';

describe('library filters', () => {
  it('classifies web documents as articles', () => {
    const document = sampleDocument();
    document.source.kind = 'web';
    expect(classifyDocument(document)).toBe('articles');
    expect(filterLibrary([document], [], 'articles')).toHaveLength(1);
  });
});
