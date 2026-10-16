import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../lib/library-state.js';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { documents } = useLibrary();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const items = useMemo(() => {
    const staticItems = [
      { id: 'home', label: 'Desk', run: () => navigate('/desk') },
      { id: 'landing', label: 'Landing', run: () => navigate('/') },
      { id: 'library', label: 'Library', run: () => navigate('/library') },
      { id: 'search', label: 'Search', run: () => navigate('/search') },
      { id: 'ask', label: 'Ask the library', run: () => navigate('/ask') },
      { id: 'notes', label: 'Highlights', run: () => navigate('/notes') },
      { id: 'settings', label: 'Settings', run: () => navigate('/settings') },
    ];
    const docs = documents.slice(0, 12).map((document) => ({
      id: document.id,
      label: `Open “${document.metadata.title}”`,
      run: () => navigate(`/read/${document.id}`),
    }));
    const q = query.trim().toLowerCase();
    return [...staticItems, ...docs].filter((item) => item.label.toLowerCase().includes(q));
  }, [documents, navigate, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-[12vh] w-full max-w-lg overflow-hidden rounded-md border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Go somewhere"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  item.run();
                  setOpen(false);
                  setQuery('');
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Esc to close
        </p>
      </div>
    </div>
  );
}
