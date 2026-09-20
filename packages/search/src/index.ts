import MiniSearch from 'minisearch';
import { documentPlainText } from '@locked-in/core';
import type {
  CanonicalDocument,
  Highlight,
  Note,
  Tag,
} from '@locked-in/types';

export interface SearchHit {
  id: string;
  kind: 'document' | 'highlight' | 'note';
  title: string;
  excerpt: string;
  score: number;
  documentId?: string;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  upsert(id: string, vector: number[], meta: Record<string, string>): Promise<void>;
  query(vector: number[], limit: number): Promise<Array<{ id: string; score: number }>>;
}

export class LibrarySearch {
  private readonly index = new MiniSearch<SearchHit & { body: string }>({
    fields: ['title', 'body', 'excerpt'],
    storeFields: ['kind', 'title', 'excerpt', 'documentId'],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
  });

  ingest(input: {
    documents: CanonicalDocument[];
    highlights?: Highlight[];
    notes?: Note[];
    tags?: Tag[];
  }): void {
    this.index.removeAll();
    const tagNames = new Map((input.tags ?? []).map((tag) => [tag.id, tag.name]));
    const docs = input.documents.map((document) => {
      const tags = document.tagIds.map((id) => tagNames.get(id) ?? '').join(' ');
      const body = `${documentPlainText(document.blocks)} ${document.metadata.authors.join(' ')} ${tags}`;
      return {
        id: document.id,
        kind: 'document' as const,
        title: document.metadata.title,
        excerpt: document.metadata.description ?? document.blocks[0]?.text ?? '',
        body,
        documentId: document.id,
        score: 0,
      };
    });
    const highlights = (input.highlights ?? []).map((highlight) => ({
      id: highlight.id,
      kind: 'highlight' as const,
      title: highlight.text.slice(0, 80),
      excerpt: highlight.text,
      body: highlight.text,
      documentId: highlight.documentId,
      score: 0,
    }));
    const notes = (input.notes ?? []).map((note) => ({
      id: note.id,
      kind: 'note' as const,
      title: note.body.slice(0, 80),
      excerpt: note.body,
      body: note.body,
      documentId: note.target.kind === 'document' ? note.target.documentId : undefined,
      score: 0,
    }));
    this.index.addAll([...docs, ...highlights, ...notes]);
  }

  search(query: string): SearchHit[] {
    if (!query.trim()) return [];
    return this.index.search(query).map((hit) => ({
      id: String(hit.id),
      kind: (hit.kind as SearchHit['kind']) ?? 'document',
      title: String(hit.title ?? ''),
      excerpt: String(hit.excerpt ?? ''),
      score: hit.score,
      documentId: hit.documentId ? String(hit.documentId) : undefined,
    }));
  }
}

export async function hybridSearch(
  lexical: LibrarySearch,
  query: string,
  embedding?: EmbeddingProvider,
  store?: VectorStore,
): Promise<SearchHit[]> {
  const exact = lexical.search(query);
  if (!embedding || !store) return exact;
  const [vector] = await embedding.embed([query]);
  if (!vector) return exact;
  const semantic = await store.query(vector, 8);
  const byId = new Map(exact.map((hit) => [hit.id, hit]));
  for (const item of semantic) {
    const existing = byId.get(item.id);
    if (existing) existing.score += item.score;
  }
  return [...byId.values()].sort((a, b) => b.score - a.score);
}
