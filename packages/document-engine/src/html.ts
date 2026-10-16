import { parse as parseHtmlTree } from 'node-html-parser';
import type { CanonicalDocument } from '@locked-in/types';
import { sanitizeHref } from '@locked-in/core';
import { buildDocument, type DraftBlock } from './builder.js';
import type { ParseInput } from './types.js';

const DROP_TAGS = new Set([
  'script',
  'style',
  'nav',
  'footer',
  'aside',
  'form',
  'iframe',
  'noscript',
  'svg',
  'math',
  'canvas',
  'template',
  'button',
  'head',
]);

function walk(node: ReturnType<typeof parseHtmlTree>, blocks: DraftBlock[]): void {
  if (node.nodeType === 3) {
    const text = node.text.replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = node.tagName?.toLowerCase();
  if (!tag || DROP_TAGS.has(tag)) return;

  if (/^h[1-6]$/.test(tag)) {
    blocks.push({ type: 'heading', text: node.text.trim(), level: Number(tag[1]) });
    return;
  }
  if (tag === 'p') {
    const text = node.text.replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    return;
  }
  if (tag === 'blockquote') {
    blocks.push({ type: 'quote', text: node.text.replace(/\s+/g, ' ').trim() });
    return;
  }
  if (tag === 'pre' || tag === 'code') {
    blocks.push({ type: 'code', text: node.text });
    return;
  }
  if (tag === 'li') {
    blocks.push({ type: 'list-item', text: node.text.replace(/\s+/g, ' ').trim() });
    return;
  }
  if (tag === 'ul' || tag === 'ol') {
    for (const child of node.childNodes) {
      walk(child as typeof node, blocks);
    }
    return;
  }
  if (tag === 'img') {
    blocks.push({
      type: 'image',
      text: node.getAttribute('alt') ?? '',
      alt: node.getAttribute('alt') ?? '',
      href: sanitizeHref(node.getAttribute('src') ?? undefined),
    });
    return;
  }
  if (tag === 'hr') {
    blocks.push({ type: 'divider', text: '' });
    return;
  }
  if (tag === 'a' && node.childNodes.length === 0) {
    return;
  }
  for (const child of node.childNodes) {
    walk(child as typeof node, blocks);
  }
}

export function parseHtml(input: ParseInput): CanonicalDocument {
  const root = parseHtmlTree(input.text ?? '', { comment: false });
  for (const tag of DROP_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  }
  const article = root.querySelector('article') ?? root.querySelector('main') ?? root.querySelector('body') ?? root;
  const title =
    input.title ??
    root.querySelector('h1')?.text.trim() ??
    root.querySelector('title')?.text.trim() ??
    input.filename;
  const blocks: DraftBlock[] = [];
  walk(article, blocks);
  return buildDocument({
    source: {
      kind: input.url ? 'web' : 'html',
      filename: input.filename,
      mimeType: input.mimeType ?? 'text/html',
      url: sanitizeHref(input.url),
      siteName: input.siteName,
    },
    title,
    language: root.querySelector('html')?.getAttribute('lang') ?? undefined,
    blocks: blocks.length ? blocks : [{ type: 'paragraph', text: article.text.replace(/\s+/g, ' ').trim() }],
  });
}
