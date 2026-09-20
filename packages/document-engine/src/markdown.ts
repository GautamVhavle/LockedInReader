import { marked, type Token, type Tokens } from 'marked';
import type { CanonicalDocument } from '@locked-in/types';
import { buildDocument, type DraftBlock } from './builder.js';
import type { ParseInput } from './types.js';

function collect(tokens: Token[], blocks: DraftBlock[]): void {
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        blocks.push({ type: 'heading', text: token.text, level: token.depth });
        break;
      case 'paragraph':
        blocks.push({ type: 'paragraph', text: token.text });
        break;
      case 'blockquote':
        blocks.push({
          type: 'quote',
          text: token.text.replace(/\n+/g, ' ').trim(),
        });
        break;
      case 'list': {
        for (const item of token.items as Tokens.ListItem[]) {
          blocks.push({
            type: 'list-item',
            text: item.text,
            listStyle: token.ordered ? 'ordered' : 'unordered',
          });
        }
        break;
      }
      case 'code':
        blocks.push({ type: 'code', text: token.text, language: token.lang });
        break;
      case 'hr':
        blocks.push({ type: 'divider', text: '' });
        break;
      case 'space':
        break;
      default:
        if ('text' in token && typeof token.text === 'string' && token.text.trim()) {
          blocks.push({ type: 'paragraph', text: token.text });
        }
    }
  }
}

export function parseMarkdown(input: ParseInput): CanonicalDocument {
  const tokens = marked.lexer(input.text ?? '');
  const blocks: DraftBlock[] = [];
  collect(tokens, blocks);
  return buildDocument({
    source: {
      kind: 'markdown',
      filename: input.filename,
      mimeType: input.mimeType ?? 'text/markdown',
      url: input.url,
    },
    title: input.title,
    blocks: blocks.length ? blocks : [{ type: 'paragraph', text: '' }],
  });
}
