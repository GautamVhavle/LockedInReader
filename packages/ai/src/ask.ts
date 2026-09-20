import type { LibrarySearch } from '@locked-in/search';
import type { AIAnswer, CanonicalDocument, KnowledgeScope } from '@locked-in/types';
import type { AIProvider } from './provider.js';

export async function askLibrary(
  provider: AIProvider,
  search: LibrarySearch,
  documents: CanonicalDocument[],
  question: string,
  scope: KnowledgeScope = 'library',
  scopedDocument?: CanonicalDocument,
): Promise<AIAnswer> {
  const corpus =
    scope === 'document' && scopedDocument
      ? [scopedDocument]
      : scope === 'library'
        ? documents
        : documents;
  search.ingest({ documents: corpus });
  const hits = search.search(question).slice(0, 6);
  const byId = new Map<string, CanonicalDocument>(corpus.map((doc) => [doc.id, doc]));
  const context: string[] = [];
  const citations = hits.flatMap((hit) => {
    const doc = byId.get(hit.documentId ?? hit.id);
    if (!doc) return [];
    const excerpt = hit.excerpt || doc.blocks[0]?.text || doc.metadata.title;
    context.push(`${doc.metadata.title}: ${excerpt}`);
    return [
      {
        documentId: doc.id,
        title: doc.metadata.title,
        excerpt,
      },
    ];
  });
  if (citations.length === 0 && scopedDocument) {
    context.push(...scopedDocument.blocks.slice(0, 6).map((block) => block.text));
    citations.push({
      documentId: scopedDocument.id,
      title: scopedDocument.metadata.title,
      excerpt: scopedDocument.blocks[0]?.text ?? '',
    });
  }
  return provider.generate({
    prompt: question,
    context,
    citations,
  });
}
