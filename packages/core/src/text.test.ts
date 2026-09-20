import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl, sanitizeHref } from './urls.js';
import { countWords } from './text.js';

describe('countWords', () => {
  it('counts latin words', () => {
    expect(countWords('Read faster. Listen anywhere.')).toBe(4);
  });

  it('counts CJK characters as words', () => {
    expect(countWords('你好世界')).toBe(4);
  });
});

describe('url safety', () => {
  it('allows https and blocks javascript', () => {
    expect(isSafeHttpUrl('https://example.com/article')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined();
  });
});
