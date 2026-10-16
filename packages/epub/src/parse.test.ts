import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { parseEpub } from './parse.js';

async function fixtureEpub(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?><container><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
  );
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0"?>
<package>
  <metadata>
    <dc:title>Fixture Book</dc:title>
    <dc:creator>Ada</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`,
  );
  zip.file(
    'OEBPS/ch1.xhtml',
    `<html><body><h1>Chapter One</h1><p>Read faster. Own your knowledge.</p></body></html>`,
  );
  return zip.generateAsync({ type: 'uint8array' });
}

describe('parseEpub', () => {
  it('reads metadata, chapter text, and TOC', async () => {
    const document = await parseEpub({
      bytes: await fixtureEpub(),
      filename: 'fixture.epub',
    });
    expect(document.metadata.title).toBe('Fixture Book');
    expect(document.metadata.authors).toEqual(['Ada']);
    expect(document.blocks.some((block) => block.text.includes('Own your knowledge'))).toBe(true);
    expect(document.structure.toc.length).toBeGreaterThan(0);
    expect(document.source.kind).toBe('epub');
  });

  it('skips nav, styles, and tags', async () => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file(
      'META-INF/container.xml',
      '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>',
    );
    zip.file(
      'OEBPS/content.opf',
      `<package><metadata><dc:title>Tagged</dc:title></metadata>
      <manifest>
        <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
      </manifest>
      <spine><itemref idref="nav"/><itemref idref="c1"/></spine></package>`,
    );
    zip.file(
      'OEBPS/nav.xhtml',
      '<html><body><nav><a href="c1.xhtml">Contents junk</a></nav></body></html>',
    );
    zip.file(
      'OEBPS/c1.xhtml',
      `<html><head><style>p{color:red}</style></head><body>
        <svg><text>icon</text></svg>
        <h1>The <em>margin</em></h1>
        <p>Hello <span>world</span>.<br/>Stay.</p>
        <p>12</p>
        <p>&lt;div&gt;not markup&lt;/div&gt;</p>
      </body></html>`,
    );
    const document = await parseEpub({
      bytes: await zip.generateAsync({ type: 'uint8array' }),
      filename: 'tagged.epub',
    });
    const blob = document.blocks.map((block) => block.text).join('\n');
    expect(blob).toContain('The margin');
    expect(blob).toContain('Hello world. Stay.');
    expect(blob).toContain('not markup');
    expect(blob).not.toContain('Contents junk');
    expect(blob).not.toContain('icon');
    expect(blob).not.toContain('color:red');
    expect(blob).not.toMatch(/[<>]/);
    expect(document.blocks.some((block) => block.text.trim() === '12')).toBe(false);
  });

  it('refuses encrypted books', async () => {
    const zip = new JSZip();
    zip.file('META-INF/container.xml', '<container><rootfiles><rootfile full-path="x.opf"/></rootfiles></container>');
    zip.file('META-INF/encryption.xml', '<encryption/>');
    zip.file('x.opf', '<package/>');
    await expect(
      parseEpub({ bytes: await zip.generateAsync({ type: 'uint8array' }), filename: 'drm.epub' }),
    ).rejects.toThrow(/Protected/);
  });
});
