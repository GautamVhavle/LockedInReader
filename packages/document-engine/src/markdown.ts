import { marked, type Token, type Tokens } from 'marked';
import { markupToText, readableText } from '@locked-in/core';
import type { CanonicalDocument } from '@locked-in/types';
import { buildDocument, type DraftBlock } from './builder.js';
import type { ParseInput } from './types.js';

function inlinePlain(token: Token): string {
  if (token.type === 'code') return '';
  if (token.type === 'codespan' && 'text' in token && typeof token.text === 'string') return token.text;
  if (token.type === 'html') {
    const raw = 'text' in token && typeof token.text === 'string' ? token.text : '';
    return markupToText(raw);
  }
  if ('tokens' in token && Array.isArray(token.tokens) && token.tokens.length > 0) {
    return token.tokens.map((child) => inlinePlain(child as Token)).join('');
  }
  if ('text' in token && typeof token.text === 'string') return token.text;
  return '';
}

function collect(tokens: Token[], blocks: DraftBlock[]): void {
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        blocks.push({ type: 'heading', text: readableText(inlinePlain(token)), level: token.depth });
        break;
      case 'paragraph':
        blocks.push({ type: 'paragraph', text: readableText(inlinePlain(token)) });
        break;
      case 'blockquote':
        blocks.push({ type: 'quote', text: readableText(inlinePlain(token)) });
        break;
      case 'list': {
        for (const item of token.items as Tokens.ListItem[]) {
          blocks.push({
            type: 'list-item',
            text: readableText(inlinePlain(item as unknown as Token)),
            listStyle: token.ordered ? 'ordered' : 'unordered',
          });
        }
        break;
      }
      case 'code':
        blocks.push({ type: 'code', text: token.text, language: token.lang });
        break;
      case 'html': {
        const text = readableText('text' in token && typeof token.text === 'string' ? token.text : '');
        if (text) blocks.push({ type: 'paragraph', text });
        break;
      }
      case 'hr':
        blocks.push({ type: 'divider', text: '' });
        break;
      case 'space':
        break;
      default:
        if ('text' in token && typeof token.text === 'string' && token.text.trim()) {
          blocks.push({ type: 'paragraph', text: readableText(token.text) });
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
