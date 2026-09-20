import type { CanonicalDocument, DocumentSourceKind } from '@locked-in/types';
import { parseHtml } from './html.js';
import { parseMarkdown } from './markdown.js';
import { parseTxt } from './txt.js';
import type { DocumentParser, ParseInput } from './types.js';

const builtin: DocumentParser[] = [
  {
    kind: 'markdown',
    sniff: (input) =>
      Boolean(
        input.filename?.match(/\.mdx?$/i) ||
          input.mimeType?.includes('markdown') ||
          (input.text?.startsWith('#') && !input.filename?.match(/\.(html|epub|pdf|txt)$/i)),
      ),
    parse: async (input) => parseMarkdown(input),
  },
  {
    kind: 'html',
    sniff: (input) =>
      Boolean(
        input.mimeType?.includes('html') ||
          input.filename?.match(/\.html?$/i) ||
          input.text?.trimStart().startsWith('<'),
      ),
    parse: async (input) => parseHtml(input),
  },
  {
    kind: 'txt',
    sniff: () => true,
    parse: async (input) => parseTxt(input),
  },
];

export class DocumentEngine {
  private readonly parsers: DocumentParser[] = [...builtin];

  register(parser: DocumentParser): void {
    this.parsers.unshift(parser);
  }

  sniff(input: ParseInput): DocumentSourceKind {
    return this.parsers.find((parser) => parser.sniff(input))?.kind ?? 'txt';
  }

  async ingest(input: ParseInput): Promise<CanonicalDocument> {
    const parser = this.parsers.find((item) => item.sniff(input)) ?? builtin.at(-1);
    if (!parser) throw new Error('No document parser registered');
    const document = await parser.parse(input);
    if (document.blocks.length === 0) {
      throw new Error('Parser produced an empty document');
    }
    return document;
  }
}

export const defaultDocumentEngine = new DocumentEngine();
