import { parseTxt, type DocumentParser, type ParseInput } from '@locked-in/document-engine';
import type { CanonicalDocument } from '@locked-in/types';
import type { OCRProvider } from './ocr.js';

function decodePdfString(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/** Extract text from simple uncompressed PDF content streams. */
export function extractPdfText(bytes: Uint8Array): { text: string; pageCount: number } {
  const source = new TextDecoder('latin1').decode(bytes);
  if (!source.startsWith('%PDF')) {
    throw new Error('Not a PDF file');
  }
  const pageCount = Math.max(1, (source.match(/\/Type\s*\/Page\b/g) ?? []).length);
  const chunks: string[] = [];
  const paren = /\((?:\\.|[^\\)])*\)/g;
  const hex = /<([0-9A-Fa-f\s]+)>/g;
  for (const match of source.matchAll(paren)) {
    const inner = match[0].slice(1, -1);
    const text = decodePdfString(inner).trim();
    if (text && /[A-Za-z0-9]/.test(text)) chunks.push(text);
  }
  if (chunks.length === 0) {
    for (const match of source.matchAll(hex)) {
      const hexStr = match[1]?.replace(/\s+/g, '') ?? '';
      if (hexStr.length % 2 !== 0) continue;
      const chars: string[] = [];
      for (let i = 0; i < hexStr.length; i += 2) {
        chars.push(String.fromCharCode(Number.parseInt(hexStr.slice(i, i + 2), 16)));
      }
      const text = chars.join('').trim();
      if (text) chunks.push(text);
    }
  }
  return { text: chunks.join(' '), pageCount };
}

export function parsePdfBytes(input: ParseInput, ocr?: OCRProvider): Promise<CanonicalDocument> {
  if (!input.bytes) return Promise.reject(new Error('PDF parser requires bytes'));
  const extracted = extractPdfText(input.bytes);
  if (!extracted.text.trim()) {
    if (ocr) {
      return ocr.recognize({ bytes: input.bytes }).then((result) => {
        const document = parseTxt({
          text: result.text,
          filename: input.filename,
          title: input.title,
        });
        document.source = { kind: 'pdf', filename: input.filename, mimeType: 'application/pdf' };
        document.metadata.pageCount = result.pages.length || undefined;
        return document;
      });
    }
    const empty = parseTxt({
      text: 'This PDF has no extractable text. OCR is not configured.',
      filename: input.filename,
      title: input.title ?? input.filename,
    });
    empty.source = { kind: 'pdf', filename: input.filename, mimeType: 'application/pdf' };
    return Promise.resolve(empty);
  }
  const document = parseTxt({
    text: extracted.text,
    filename: input.filename,
    title: input.title ?? input.filename,
  });
  document.source = { kind: 'pdf', filename: input.filename, mimeType: 'application/pdf' };
  document.metadata.pageCount = extracted.pageCount;
  return Promise.resolve(document);
}

export function createPdfParser(ocr?: OCRProvider): DocumentParser {
  return {
    kind: 'pdf',
    sniff: (input) =>
      Boolean(input.filename?.match(/\.pdf$/i) || input.mimeType?.includes('pdf')),
    parse: (input) => parsePdfBytes(input, ocr),
  };
}

export const pdfParser = createPdfParser();
