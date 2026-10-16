import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cleanDocument } from '@locked-in/document-engine';
import { themeClass } from '@locked-in/themes';
import type { AppSettings, CanonicalDocument, Highlight, Note, ReadingProgress } from '@locked-in/types';
import { DEFAULT_SETTINGS } from '@locked-in/types';
import { seedShelfIfNeeded, storageReady, workspace } from './platform.js';
import { listAfterSeed } from './shelf.js';

interface LibraryState {
  documents: CanonicalDocument[];
  highlights: Highlight[];
  notes: Note[];
  progress: ReadingProgress[];
  settings: AppSettings;
  refresh: () => Promise<void>;
  ready: boolean;
  error: string | undefined;
}

const Context = createContext<LibraryState | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<CanonicalDocument[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    try {
      await storageReady;
      const seeded = await listAfterSeed(
        () => workspace.documents.list(),
        (docs) => seedShelfIfNeeded(docs),
      );
      const [marks, storedNotes, storedProgress, storedSettings] = await Promise.all([
        workspace.annotations.listHighlights(),
        workspace.annotations.listNotes(),
        workspace.progress.list(),
        workspace.settings.get(),
      ]);
      setDocuments(seeded.map(cleanDocument).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setHighlights(marks);
      setNotes(storedNotes);
      setProgress(storedProgress);
      setSettings(storedSettings);
      document.documentElement.className = themeClass(storedSettings.theme);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The local library could not be opened');
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ documents, highlights, notes, progress, settings, refresh, ready, error }),
    [documents, highlights, notes, progress, settings, refresh, ready, error],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLibrary(): LibraryState {
  const value = useContext(Context);
  if (!value) throw new Error('useLibrary must be used within LibraryProvider');
  return value;
}
