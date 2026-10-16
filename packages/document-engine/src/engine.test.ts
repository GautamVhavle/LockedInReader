import { describe, expect, it } from 'vitest';
import { SAMPLE_HTML, SAMPLE_MARKDOWN, SAMPLE_TXT } from '@locked-in/testing';
import { CanonicalDocumentSchema } from '@locked-in/types';
import { defaultDocumentEngine } from './engine.js';

describe('DocumentEngine', () => {
  it('normalizes markdown, html, and txt into the same canonical shape', async () => {
    const md = await defaultDocumentEngine.ingest({
      text: SAMPLE_MARKDOWN,
      filename: 'sample.md',
    });
    const html = await defaultDocumentEngine.ingest({
      text: SAMPLE_HTML,
      filename: 'sample.html',
    });
    const txt = await defaultDocumentEngine.ingest({
      text: SAMPLE_TXT,
      filename: 'sample.txt',
    });

    for (const document of [md, html, txt]) {
      expect(CanonicalDocumentSchema.parse(document).blocks.length).toBeGreaterThan(0);
      expect(document.blocks.every((block) => block.id)).toBe(true);
    }

    expect(md.metadata.title).toBe('Locked In');
    expect(md.blocks.filter((block) => block.type === 'list')).toHaveLength(0);
    expect(md.blocks.some((block) => block.type === 'list-item')).toBe(true);
    expect(md.blocks.some((block) => block.type === 'heading')).toBe(true);
    expect(md.blocks.some((block) => block.type === 'code')).toBe(true);
    expect(html.metadata.title).toMatch(/Personal Knowledge/i);
    expect(html.blocks.some((block) => block.text.includes('navigation'))).toBe(false);
  });

  it('reads words, not markdown markers or html tags', async () => {
    const document = await defaultDocumentEngine.ingest({
      filename: 'tags.md',
      text: '# Title\n\nHello **there** and <em>you</em>.\n\n<p>Hi <b>friend</b></p>\n\n<script>alert(1)</script>\n',
    });
    const blob = document.blocks.map((block) => block.text).join('\n');
    expect(blob).toContain('Hello there and you.');
    expect(blob).toContain('Hi friend');
    expect(blob).not.toContain('alert');
    expect(blob).not.toMatch(/[<>*]/);
  });

  it('strips javascript urls from html', async () => {
    const document = await defaultDocumentEngine.ingest({
      text: `<article><p>Hello</p><img src="javascript:alert(1)" alt="x"></article>`,
      filename: 'bad.html',
    });
    const image = document.blocks.find((block) => block.type === 'image');
    expect(image?.href).toBeUndefined();
  });
});
