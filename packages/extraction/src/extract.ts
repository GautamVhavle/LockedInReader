import { parseHtml, type ParseInput } from '@locked-in/document-engine';
import { sanitizeHref } from '@locked-in/core';
import type { CanonicalDocument } from '@locked-in/types';
import { adapterFor } from './adapters.js';

export interface ExtractionInput {
  html: string;
  url?: string;
  selection?: string;
  title?: string;
}

export function extractWebDocument(input: ExtractionInput): CanonicalDocument {
  if (input.selection?.trim()) {
    return parseHtml({
      text: `<article><p>${escapeHtml(input.selection.trim())}</p></article>`,
      url: sanitizeHref(input.url),
      title: input.title,
    });
  }

  const url = input.url ?? '';
  const adapter = url ? adapterFor(url) : undefined;
  const adapted = adapter?.extract(input.html, url);
  const html = adapted?.html ?? input.html;
  const document = parseHtml({
    text: html,
    url: sanitizeHref(input.url),
    title: adapted?.title ?? input.title,
    siteName: adapted?.siteName,
    mimeType: 'text/html',
  });
  document.source.kind = 'web';
  document.source.url = sanitizeHref(input.url);
  return document;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export const webParser = {
  kind: 'web' as const,
  sniff: (input: ParseInput) => Boolean(input.url && (input.text?.includes('<') || input.mimeType?.includes('html'))),
  parse: async (input: ParseInput) =>
    extractWebDocument({ html: input.text ?? '', url: input.url, title: input.title }),
};
