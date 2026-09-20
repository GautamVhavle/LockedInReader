import { Route, Routes } from 'react-router-dom';
import { Toaster } from '@locked-in/ui';
import { CommandPalette } from './components/command-palette.js';
import { Shell } from './components/shell.js';
import { LibraryProvider } from './lib/library-state.js';
import { AskPage } from './pages/ask.js';
import { HomePage } from './pages/home.js';
import { LibraryPage } from './pages/library.js';
import { NotesPage } from './pages/notes.js';
import { ReaderPage } from './pages/reader.js';
import { SearchPage } from './pages/search-page.js';
import { SettingsPage, ThemedApp } from './pages/settings.js';
import { SpeedPage } from './pages/speed.js';

export function App() {
  return (
    <ThemedApp>
      <LibraryProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/read/:id" element={<ReaderPage />} />
          <Route path="/speed/:id" element={<SpeedPage />} />
        </Routes>
        <CommandPalette />
        <Toaster />
      </LibraryProvider>
    </ThemedApp>
  );
}
