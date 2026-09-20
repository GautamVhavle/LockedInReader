# Locked In Reader

**Read faster. Listen anywhere. Remember everything. Own your knowledge.**

Open-source, local-first reading OS: capture articles and documents, read or speed-read them, highlight, listen, search, and ask your own library. An account is only for optional sync and hosted AI.

## Quick start

```bash
pnpm install
pnpm dev
```

- PWA: http://localhost:5173
- Extension: load `apps/extension/dist` unpacked after `pnpm --filter @locked-in/extension build`
- Docs: `pnpm --filter @locked-in/docs dev`

## What works offline

Import Markdown, TXT, HTML, EPUB, and PDF. Read in a typographic reader. Speed-read with RSVP / ORP / chunk / guided modes. Highlight, note, bookmark, and resume. Search the local library. Speak with browser TTS.

## Optional cloud

- SpaceXAI for grounded document Q&A (`XAI_API_KEY`)
- Ollama for local models
- `services/api` + Docker Compose for self-hosted sync

## Workspace

See `LOCKED_IN_IMPLEMENTATION_PLAN.md`, `Vision.md`, and `docs/architecture/ARCHITECTURE.md`.
