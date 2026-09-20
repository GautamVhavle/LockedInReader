import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { LibraryFilter } from '@locked-in/types';
import { classifyDocument, filterLibrary } from '@locked-in/library';
import { DocumentCard } from '@locked-in/ui';
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
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <h1 className="font-serif text-4xl tracking-tight">Library</h1>
        <p className="font-mono text-[10px] text-muted-foreground">{visible.length}</p>
      </header>
      <div className="mb-6 flex flex-wrap gap-4">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
              filter === item.id ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>
        {visible.map((document) => (
          <div key={document.id} className="group relative">
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
              className="absolute right-0 top-3 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground group-hover:block"
              onClick={(event) => {
                event.stopPropagation();
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
    </div>
  );
}
