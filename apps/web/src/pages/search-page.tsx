import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibrarySearch } from '@locked-in/search';
import { useLibrary } from '../lib/library-state.js';

export function SearchPage() {
  const { documents, highlights, notes } = useLibrary();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const search = useMemo(() => {
    const index = new LibrarySearch();
    index.ingest({ documents, highlights, notes });
    return index;
  }, [documents, highlights, notes]);
  const hits = search.search(query);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Search</h1>
      <input
        autoFocus
        placeholder="A title, a sentence, a mark"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-8 h-12 w-full border-b border-border bg-transparent text-lg outline-none placeholder:text-muted-foreground"
      />
      <ul className="mt-8">
        {hits.map((hit) => (
          <li key={hit.id} className="border-b border-border">
            <button
              type="button"
              className="w-full py-4 text-left"
              onClick={() => hit.documentId && navigate(`/read/${hit.documentId}`)}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{hit.kind}</p>
              <p className="mt-1 font-serif text-2xl">{hit.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hit.excerpt}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
