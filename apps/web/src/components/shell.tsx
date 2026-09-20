import {
  BookOpen,
  Highlighter,
  Home,
  Search,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { ingestFiles } from '../lib/platform.js';

const links = [
  { to: '/', label: 'Desk', icon: Home },
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/ask', label: 'Ask', icon: Sparkles },
  { to: '/notes', label: 'Marks', icon: Highlighter },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Shell() {
  const { refresh, error } = useLibrary();
  const navigate = useNavigate();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      const last = await ingestFiles(files);
      await refresh();
      toast.success(files.length > 1 ? `Imported ${files.length} documents` : 'Imported');
      if (last) navigate(`/read/${last.id}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not import that file');
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[12rem_1fr]">
      <aside className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-3 md:py-5">
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-6">
          <div className="flex items-center gap-2 px-2">
            <svg width="16" height="20" viewBox="0 0 18 22" fill="none" aria-hidden>
              <rect x="1" y="1" width="16" height="20" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 1v20" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9 11v0" stroke="#C45C26" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="hidden font-serif text-sm md:inline">Locked In</span>
          </div>
          <nav className="flex gap-1 md:flex-col">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rail-link relative flex items-center gap-2 px-2 py-2 text-sm',
                    isActive && 'text-foreground',
                  )
                }
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground">
          <Upload className="h-4 w-4" />
          <span className="hidden md:inline">Import</span>
          <input
            type="file"
            className="hidden"
            multiple
            accept=".md,.txt,.html,.epub,.pdf,text/plain,text/markdown,text/html,application/epub+zip,application/pdf"
            onChange={(event) => void onFiles(event.target.files)}
          />
        </label>
      </aside>
      <main className="min-h-screen">
        {error ? (
          <p className="px-6 py-4 text-sm text-destructive">{error}</p>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
