import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { themeClass } from '@locked-in/themes';
import type { AIProviderId, ProductTheme } from '@locked-in/types';
import { clampWpm, WPM_MAX, WPM_MIN } from '@locked-in/reader-engine';
import { Label, Slider, Switch, ThemeSwitcher } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { workspace } from '../lib/platform.js';

export function SettingsPage() {
  const { settings, refresh, documents } = useLibrary();
  const { setTheme } = useTheme();

  async function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    const next = { ...settings, [key]: value };
    await workspace.settings.save(next);
    if (key === 'theme') {
      document.documentElement.className = themeClass(value as ProductTheme);
      setTheme(value as string);
    }
    await refresh();
  }

  function exportLibrary() {
    const blob = new Blob([JSON.stringify(documents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'locked-in-library.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Settings</h1>
      <section className="mt-10 flex flex-col gap-3">
        <Label>Theme</Label>
        <ThemeSwitcher value={settings.theme} onChange={(theme) => void update('theme', theme)} />
      </section>
      <section className="mt-8 flex flex-col gap-3">
        <Label>Default speed ({clampWpm(settings.wpm)} WPM)</Label>
        <Slider
          value={[clampWpm(settings.wpm)]}
          min={WPM_MIN}
          max={WPM_MAX}
          step={10}
          onValueChange={([value]) => value && void update('wpm', clampWpm(value))}
          aria-label="Default WPM"
        />
      </section>
      <section className="mt-8 flex items-center justify-between">
        <Label>ORP copper letter</Label>
        <Switch checked={settings.orpEnabled} onCheckedChange={(checked) => void update('orpEnabled', checked)} />
      </section>
      <section className="mt-8 flex flex-col gap-2">
        <Label>AI provider</Label>
        <select
          className="h-9 border border-border bg-background px-3 text-sm"
          value={settings.aiProvider}
          onChange={(event) => void update('aiProvider', event.target.value as AIProviderId)}
        >
          <option value="none">None — offline</option>
          <option value="spacexai">SpaceXAI — key on this device</option>
          <option value="ollama">Ollama — local</option>
        </select>
      </section>
      <button
        type="button"
        onClick={exportLibrary}
        className="mt-10 h-10 w-fit border border-border px-4 font-mono text-[10px] uppercase tracking-[0.18em]"
      >
        Export library JSON
      </button>
      <p className="mt-6 text-sm text-muted-foreground">
        Reading does not need an account. Export keeps a copy you can move yourself.
      </p>
    </div>
  );
}

export function ThemedApp({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} themes={['light', 'dark', 'sepia', 'night']}>
      {children}
    </ThemeProvider>
  );
}
