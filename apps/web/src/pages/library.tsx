import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { LibraryFilter } from '@locked-in/types';
import { classifyDocument, filterLibrary } from '@locked-in/library';
import { DocumentCard, EmptyState } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { removeDocument } from '../lib/platform.js';

const filters: Array<{ id: LibraryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'continue', label: 'Continue' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'books', label: 'Books' },
  { id: 'articles', label: 'Articles' },
  { id: 'papers', label: 'Papers' },
  { id: 'archive', label: 'Archive' },
];

export function LibraryPage() {
  const { documents, progress, refresh } = useLibrary();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const navigate = useNavigate();
  const visible = filterLibrary(documents, progress, filter);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Library
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight">The whole shelf</h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            Same piles as the desk: books, articles, papers, and files you have not opened.
          </p>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {visible.length} showing
        </p>
      </header>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border" role="toolbar" aria-label="Shelf">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`min-h-11 border-b-2 px-3 font-mono text-[10px] uppercase tracking-[0.16em] ${
              filter === item.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title="Nothing on this shelf"
          body="This filter is empty. Import a file, or switch back to All."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((document) => (
            <div key={document.id} className="relative">
              <DocumentCard
                title={document.metadata.title}
                kind={classifyDocument(document)}
                excerpt={document.blocks.find((block) => block.text)?.text ?? ''}
                progress={progress.find((item) => item.documentId === document.id)?.percent}
                words={document.metadata.wordCount}
                onClick={() => navigate(`/read/${document.id}`)}
              />
              <button
                type="button"
                className="absolute right-2 top-2 min-h-11 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  void removeDocument(document.id).then(() => {
                    toast.success('Removed');
                    return refresh();
                  });
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
