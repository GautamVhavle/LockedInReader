# Locked In Reader

Read faster. Stay with the sentence.

Local-first reader for Markdown, text, HTML, EPUB, and PDF. The library stays in this browser. There is no account.

The app is at [lockedinreader.vercel.app](https://lockedinreader.vercel.app).

## Develop

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. To load the Chrome extension, run `pnpm --filter @locked-in/extension build` and choose `apps/extension/dist` as an unpacked extension.

Open a document and choose Listen. The browser speaks the words on the page.
