import { describe, expect, it } from 'vitest';
import { extractWebDocument } from './extract.js';

const ARTICLE = `<html><body>
<nav>Home About Login</nav>
<article>
  <h1>A Long-Form Essay</h1>
  <p>Anything you read should become part of your personal knowledge system.</p>
</article>
<footer>subscribe now</footer>
</body></html>`;

describe('web extraction', () => {
  it('prefers article content over chrome', () => {
    const document = extractWebDocument({
      html: ARTICLE,
      url: 'https://example.com/essay',
    });
    expect(document.metadata.title).toMatch(/Long-Form Essay/);
    expect(document.blocks.some((block) => /knowledge system/.test(block.text))).toBe(true);
    expect(document.source.kind).toBe('web');
    expect(document.source.url).toBe('https://example.com/essay');
  });

  it('reads a selection instead of the page around it', () => {
    const document = extractWebDocument({
      html: ARTICLE,
      url: 'https://example.com/essay',
      selection: 'Just this sentence.',
    });
    expect(document.blocks.map((block) => block.text).join(' ')).toBe('Just this sentence.');
    expect(document.source.kind).toBe('web');
    expect(document.metadata.wordCount).toBe(3);
  });

  it('finds no readable words on a page that is only chrome', () => {
    const document = extractWebDocument({
      html: '<html><body><nav>Home About Login</nav><footer>subscribe now</footer></body></html>',
      url: 'https://example.com',
      title: 'Empty',
    });
    expect(document.blocks.some((block) => block.text.trim())).toBe(false);
    expect(document.metadata.wordCount).toBe(0);
  });

  it('uses the GitHub adapter', () => {
    const document = extractWebDocument({
      html: `<html><body><nav>repo</nav><article class="markdown-body"><h1>README</h1><p>${'word '.repeat(30)}</p></article></body></html>`,
      url: 'https://github.com/GautamVhavle/LockedInReader',
    });
    expect(document.source.siteName).toBe('GitHub');
  });
});
