# Architecture

Locked In Reader is a TypeScript monorepo. The PWA (`apps/web`) and Chrome extension (`apps/extension`) are clients of shared packages. Business logic does not live in React components or Chrome APIs.

## Principles

1. Local-first: reading, import, highlights, notes, search, and TTS work without an account.
2. Canonical documents: every source becomes the same `CanonicalDocument`.
3. Stable locations: annotations use `documentId + blockId + offsets`, never DOM coordinates.
4. Cloud is optional: Auth0, Postgres, Blob, and hosted AI are adapters.
5. Untrusted input: imported files, HTML, EPUB, PDF, and model output are treated as hostile.

## Packages

| Package | Owns |
|---|---|
| `@locked-in/types` | Zod contracts |
| `@locked-in/core` | IDs-adjacent helpers, URL safety, locations |
| `@locked-in/document-engine` | TXT/MD/HTML → canonical |
| `@locked-in/epub` | EPUB parser |
| `@locked-in/pdf` | PDF text extraction + OCR port |
| `@locked-in/extraction` | Web capture + site adapters |
| `@locked-in/reader-engine` | RSVP/ORP/chunk/guided (no React) |
| `@locked-in/storage` | StorageAdapter + repositories |
| `@locked-in/annotation` | Highlights/notes/bookmarks |
| `@locked-in/library` | Filters, sessions, progress |
| `@locked-in/search` | MiniSearch + semantic ports |
| `@locked-in/audio-engine` | TTS timeline |
| `@locked-in/ai` | Provider ports, SpaceXAI, Ollama |
| `@locked-in/sync` | Change log + conflict rules |
| `@locked-in/ui` | Tailwind v4 + shadcn-style primitives |

## Data flow

```
File / Page
  → parser
  → CanonicalDocument
  → LocalWorkspace (IndexedDB)
  → ReaderEngine / AudioTimeline / LibrarySearch / AIProvider
```
