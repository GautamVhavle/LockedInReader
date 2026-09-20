import { parse } from 'node-html-parser';

export interface SiteAdapter {
  id: string;
  match: (url: string) => boolean;
  extract: (html: string, url: string) => { title?: string; html: string; siteName: string };
}

function bySelector(html: string, selectors: string[]): string {
  const root = parse(html);
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    if (node && node.text.trim().length > 40) return node.toString();
  }
  return html;
}

export const adapters: SiteAdapter[] = [
  {
    id: 'wikipedia',
    match: (url) => /wikipedia\.org/i.test(url),
    extract: (html, _url) => ({
      siteName: 'Wikipedia',
      title: parse(html).querySelector('#firstHeading')?.text.trim(),
      html: bySelector(html, ['#mw-content-text', '.mw-parser-output']),
    }),
  },
  {
    id: 'github',
    match: (url) => /github\.com/i.test(url),
    extract: (html) => ({
      siteName: 'GitHub',
      title: parse(html).querySelector('h1')?.text.trim(),
      html: bySelector(html, ['article.markdown-body', '.markdown-body', 'article']),
    }),
  },
  {
    id: 'medium',
    match: (url) => /medium\.com/i.test(url),
    extract: (html) => ({
      siteName: 'Medium',
      html: bySelector(html, ['article']),
    }),
  },
  {
    id: 'substack',
    match: (url) => /substack\.com/i.test(url),
    extract: (html) => ({
      siteName: 'Substack',
      html: bySelector(html, ['article', '.available-content']),
    }),
  },
];

export function adapterFor(url: string): SiteAdapter | undefined {
  return adapters.find((adapter) => adapter.match(url));
}
