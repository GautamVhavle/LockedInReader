import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl, sanitizeHref } from './urls.js';
import { countWords, isBoilerplate, readableText } from './text.js';

describe('countWords', () => {
  it('counts latin words', () => {
    expect(countWords('Read faster. Listen anywhere.')).toBe(4);
  });

  it('counts CJK characters as words', () => {
    expect(countWords('你好世界')).toBe(4);
  });
});

describe('readableText', () => {
  it('keeps the words and drops tags, scripts, and styles', () => {
    expect(readableText('<p>Hello <em>world</em>.</p>')).toBe('Hello world.');
    expect(readableText('Hello<br/>world')).toBe('Hello world');
    expect(readableText('<script>alert(1)</script><p>Stay</p>')).toBe('Stay');
    expect(readableText('<style>p{color:red}</style>Only this')).toBe('Only this');
    expect(readableText('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(readableText('a < b')).toBe('a < b');
    expect(readableText('&lt;p&gt;Shown as tags&lt;/p&gt;')).toBe('Shown as tags');
  });

  it('treats bare page numbers and urls as boilerplate', () => {
    expect(isBoilerplate('12')).toBe(true);
    expect(isBoilerplate('https://example.com/ch')).toBe(true);
    expect(isBoilerplate('1984')).toBe(false);
    expect(isBoilerplate('Chapter 1')).toBe(false);
  });
});

describe('url safety', () => {
  it('allows https and blocks javascript', () => {
    expect(isSafeHttpUrl('https://example.com/article')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined();
  });
});
