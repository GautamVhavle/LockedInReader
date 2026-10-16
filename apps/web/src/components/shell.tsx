import { BookOpen, Highlighter, Home, Search, Settings, Sparkles, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { themeClass } from '@locked-in/themes';
import type { ProductTheme } from '@locked-in/types';
import { cn, ThemeSwitcher } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { ingestFiles, workspace } from '../lib/platform.js';

const groups = [
  {
    label: 'Read',
    links: [
      { to: '/desk', label: 'Desk', icon: Home },
      { to: '/library', label: 'Library', icon: BookOpen },
    ],
  },
  {
    label: 'Recall',
    links: [
      { to: '/search', label: 'Search', icon: Search },
      { to: '/ask', label: 'Ask', icon: Sparkles },
      { to: '/notes', label: 'Marks', icon: Highlighter },
    ],
  },
];

export function Shell() {
  const { refresh, error, settings } = useLibrary();
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  async function chooseTheme(theme: ProductTheme) {
    await workspace.settings.save({ ...settings, theme });
    document.documentElement.className = themeClass(theme);
    setTheme(theme);
    await refresh();
  }

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
    <div className="min-h-screen bg-background md:grid md:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 z-20 flex flex-col gap-6 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:h-svh md:border-b-0 md:border-r md:px-5 md:py-6">
        <NavLink to="/desk" className="flex items-center gap-3 px-1">
          <svg width="16" height="20" viewBox="0 0 18 22" fill="none" aria-hidden>
            <rect x="1" y="1" width="16" height="20" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6 1v20" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9 11h0" stroke="#C45C26" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>
            <span className="block font-serif text-lg leading-none">Locked In</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Reader
            </span>
          </span>
        </NavLink>
        <nav className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap md:gap-6" aria-label="Library">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-wrap gap-1 md:flex-col md:gap-1">
              <p className="hidden px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:block">
                {group.label}
              </p>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/desk'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )
                  }
                >
                  <link.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors md:hidden',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            Settings
          </NavLink>
        </nav>
        <div className="flex flex-col gap-3 md:mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'hidden min-h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors md:flex',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            Settings
          </NavLink>
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Theme
          </p>
          <ThemeSwitcher
            className="md:grid md:grid-cols-2"
            value={settings.theme}
            onChange={(theme) => void chooseTheme(theme)}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground">
            <Upload className="h-4 w-4" aria-hidden />
            Import
            <input
              type="file"
              className="hidden"
              multiple
              accept=".md,.txt,.html,.epub,.pdf,text/plain,text/markdown,text/html,application/epub+zip,application/pdf"
              onChange={(event) => void onFiles(event.target.files)}
            />
          </label>
        </div>
      </aside>
      <main className="min-h-screen">
        {error ? <p className="px-6 py-4 text-sm text-destructive">{error}</p> : null}
        <Outlet />
      </main>
    </div>
  );
}
