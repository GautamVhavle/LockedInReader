import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build, defineConfig, type Plugin } from 'vite';

let bundlingEntries = false;

// Content scripts cannot import chunks. These two entries are written as single files.
function bundleClassicEntries(): Plugin {
  return {
    name: 'bundle-classic-entries',
    apply: 'build',
    async closeBundle() {
      if (bundlingEntries || process.env.LOCKED_IN_ENTRY_BUNDLE === '1') return;
      bundlingEntries = true;
      process.env.LOCKED_IN_ENTRY_BUNDLE = '1';
      try {
        await bundleEntry('src/content.ts', 'iife', 'LockedInContent');
        await bundleEntry('src/background.ts', 'es');
      } finally {
        bundlingEntries = false;
        delete process.env.LOCKED_IN_ENTRY_BUNDLE;
      }
    },
  };
}

function bundleEntry(entry: string, format: 'iife' | 'es', name?: string): Promise<void> {
  return build({
    configFile: false,
    logLevel: 'warn',
    build: {
      emptyOutDir: false,
      outDir: 'dist',
      lib: {
        entry,
        formats: [format],
        name,
        fileName: () => (entry.includes('content') ? 'content.js' : 'background.js'),
      },
    },
  }).then(() => undefined);
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bundleClassicEntries()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: 'sidepanel.html',
        popup: 'popup.html',
        options: 'options.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
