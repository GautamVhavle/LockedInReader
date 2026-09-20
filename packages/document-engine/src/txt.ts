import type { CanonicalDocument } from '@locked-in/types';
import { buildDocument, type DraftBlock } from './builder.js';
import type { ParseInput } from './types.js';

export function parseTxt(input: ParseInput): CanonicalDocument {
  const text = input.text ?? '';
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const blocks: DraftBlock[] = paragraphs.length
    ? paragraphs.map((paragraph, index) =>
        index === 0 && !paragraph.includes('\n') && paragraph.length < 80
          ? { type: 'heading', text: paragraph, level: 1 }
          : { type: 'paragraph', text: paragraph.replace(/\n/g, ' ') },
      )
    : [{ type: 'paragraph', text: '' }];

  return buildDocument({
    source: {
      kind: 'txt',
      filename: input.filename,
      mimeType: input.mimeType ?? 'text/plain',
      url: input.url,
    },
    title: input.title ?? input.filename,
    blocks,
  });
}
