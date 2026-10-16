import JSZip from 'jszip';
import { parse as parseHtml } from 'node-html-parser';
import {
  parseHtml as htmlToDocument,
  type DocumentParser,
  type ParseInput,
} from '@locked-in/document-engine';
import { createBlockId, type CanonicalDocument } from '@locked-in/types';

function textOf(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return match?.[1]?.trim();
}

function attr(xml: string, name: string): string | undefined {
  const match = xml.match(new RegExp(`${name}="([^"]+)"`, 'i'));
  return match?.[1];
}

function resolve(base: string, href: string): string {
  if (!base.includes('/')) return href;
  const dir = base.slice(0, base.lastIndexOf('/') + 1);
  const combined = `${dir}${href}`.split('/');
  const out: string[] = [];
  for (const part of combined) {
    if (part === '..') out.pop();
    else if (part !== '.') out.push(part);
  }
  return out.join('/');
}

export async function parseEpub(input: ParseInput): Promise<CanonicalDocument> {
  if (!input.bytes) throw new Error('EPUB parser requires bytes');
  const zip = await JSZip.loadAsync(input.bytes);
  const encryption = zip.file('META-INF/encryption.xml');
  if (encryption) {
    throw new Error('Protected/encrypted EPUBs are not supported');
  }
  const container = await zip.file('META-INF/container.xml')?.async('string');
  if (!container) throw new Error('Invalid EPUB: missing container.xml');
  const opfPath = attr(container, 'full-path');
  if (!opfPath) throw new Error('Invalid EPUB: missing OPF path');
  const opf = await zip.file(opfPath)?.async('string');
  if (!opf) throw new Error('Invalid EPUB: missing OPF');

  const title = textOf(opf, 'dc:title') ?? input.title ?? input.filename ?? 'Untitled book';
  const creator = textOf(opf, 'dc:creator');
  const language = textOf(opf, 'dc:language');
  const identifier = textOf(opf, 'dc:identifier');

  const itemHrefs = [...opf.matchAll(/<item\b[^>]*>/gi)].map((match) => {
    const tag = match[0];
    return {
      id: attr(tag, 'id'),
      href: attr(tag, 'href'),
      media: attr(tag, 'media-type'),
      properties: attr(tag, 'properties') ?? '',
    };
  });
  const spineIds = [...opf.matchAll(/<itemref\b[^>]*>/gi)]
    .map((match) => attr(match[0], 'idref'))
    .filter((id): id is string => Boolean(id));

  const htmlParts: string[] = [];
  for (const id of spineIds) {
    const item = itemHrefs.find((entry) => entry.id === id);
    if (!item?.href) continue;
    if (/\bnav\b/.test(item.properties) || /(?:^|\/)(?:nav|toc)\.xhtml$/i.test(item.href)) continue;
    if (item.media && /ncx|dtb/i.test(item.media)) continue;
    if (item.media && !item.media.includes('html') && !item.media.includes('xml')) continue;
    const path = resolve(opfPath, item.href);
    const html = await zip.file(path)?.async('string');
    if (html) htmlParts.push(html);
  }

  if (htmlParts.length === 0) {
    throw new Error('Invalid EPUB: no readable spine documents');
  }

  const combined = `<article>${htmlParts
    .map((html) => {
      const root = parseHtml(html);
      return (root.querySelector('body') ?? root).innerHTML;
    })
    .join('\n')}</article>`;

  const document = htmlToDocument({
    text: combined,
    title,
    filename: input.filename,
    mimeType: 'application/epub+zip',
  });

  document.source = {
    kind: 'epub',
    filename: input.filename,
    mimeType: 'application/epub+zip',
    checksum: input.filename,
  };
  document.metadata.authors = creator ? [creator] : [];
  document.metadata.language = language;
  document.metadata.identifier = identifier;
  if (!document.metadata.title.trim()) document.metadata.title = 'Untitled book';
  document.structure.chapterCount = htmlParts.length;
  if (document.structure.toc.length === 0) {
    document.structure.toc = document.blocks
      .filter((block) => block.type === 'heading')
      .map((block) => ({
        id: block.id,
        title: block.text,
        blockId: block.id,
        children: [],
      }));
  }
  if (!document.blocks[0]) {
    document.blocks.push({
      id: createBlockId(),
      type: 'paragraph',
      text: document.metadata.title,
      order: 0,
    });
  }
  return document;
}

export const epubParser: DocumentParser = {
  kind: 'epub',
  sniff: (input) =>
    Boolean(input.filename?.match(/\.epub$/i) || input.mimeType?.includes('epub')),
  parse: parseEpub,
};
