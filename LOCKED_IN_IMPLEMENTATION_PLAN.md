# Locked In Reader — 20-Phase End-to-End Implementation Plan

> **Status:** Master implementation plan  
> **Repository:** https://github.com/GautamVhavle/LockedInReader  
> **Product:** Locked In Reader  
> **Architecture:** TypeScript monorepo, PWA + Chrome Extension, local-first, cloud-sync capable, open-source and self-hostable  
> **North Star:** Read faster. Listen anywhere. Remember everything. Own your knowledge.

---

## 0. Executive Direction

Locked In Reader is not being built as a narrow SwiftRead clone.

The product is an open-source personal reading system that combines:

- Universal document ingestion
- A highly customizable normal reader
- RSVP / ORP / chunk / guided speed reading
- EPUB and PDF book reading
- Browser capture through a Chrome extension
- Highlights, notes, bookmarks and reading progress
- Local-first storage
- Optional authentication and cloud sync
- Hybrid full-text + semantic search
- AI-assisted document understanding
- AI search across the personal knowledge base
- TTS and future AI-generated audiobooks
- Synchronized text/audio playback
- Future local LLM, embedding, OCR and TTS support
- Self-hosting and community extensibility

The implementation must preserve one central architectural principle:

> **The PWA and Chrome extension are clients of the same core platform, not two separate implementations.**

---

# 1. Global Architecture

```text
                                      LOCKED IN
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 │                        │                        │
                 ▼                        ▼                        ▼
               PWA                 Chrome Extension          Future Clients
                 │                        │                  Mobile/Desktop
                 └────────────────────────┼────────────────────────┘
                                          │
                                  SHARED CORE PACKAGES
                                          │
       ┌──────────────────────────────────┼─────────────────────────────────┐
       │                                  │                                 │
       ▼                                  ▼                                 ▼
 Document Engine                    Reading Engine                     Audio Engine
       │                                  │                                 │
       ├── EPUB                          ├── RSVP                         ├── TTS
       ├── PDF                           ├── ORP                          ├── AI Voice
       ├── HTML                          ├── Chunk                         ├── Segments
       ├── Markdown                      ├── Guided                        ├── Timeline
       ├── TXT                           └── Adaptive                       └── Sync
       └── Web
       │
       ▼
                         CANONICAL DOCUMENT MODEL
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 │                        │                        │
                 ▼                        ▼                        ▼
             Progress                Annotation                Metadata
                 │                        │                        │
                 └────────────────────────┼────────────────────────┘
                                          │
                                          ▼
                                   LOCAL-FIRST DATA
                                          │
                            ┌─────────────┴─────────────┐
                            │                           │
                       IndexedDB/OPFS                Sync
                            │                           │
                            │                     ┌─────┴─────┐
                            │                     │           │
                            ▼                     ▼           ▼
                         Offline              Postgres      Blob
                                               │
                                               ▼
                                         Search / AI
```

---

# 2. Repository Strategy

The repository should become a Turborepo + pnpm workspace.

```text
LockedInReader/
│
├── apps/
│   ├── web/
│   ├── extension/
│   └── docs/
│
├── packages/
│   ├── core/
│   ├── types/
│   ├── document-engine/
│   ├── reader-engine/
│   ├── epub/
│   ├── pdf/
│   ├── extraction/
│   ├── annotation/
│   ├── library/
│   ├── search/
│   ├── audio-engine/
│   ├── ai/
│   ├── storage/
│   ├── sync/
│   ├── themes/
│   ├── ui/
│   ├── config/
│   └── testing/
│
├── services/
│   ├── ingestion/
│   ├── metadata/
│   ├── embeddings/
│   └── ai/
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── product/
│
├── scripts/
├── tests/
├── .github/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Do not create every package as an empty abstraction on day one. Introduce packages when their boundaries become meaningful, while preserving these target boundaries.

## 2.1 UI / Styling Stack Decision (Binding)

All product UI (PWA + extension sidepanel/popup/options) uses a single shared design system:

```text
Styling: Tailwind CSS v4 (@tailwindcss/vite) + CSS variables for theming
Components: shadcn/ui (New York style, Radix UI primitives) in packages/ui
Icons: lucide-react (only icon library)
Fonts: next/font or @fontsource (Inter for UI + Source Serif 4 / Newsreader for reader + JetBrains Mono for code)
```

Companion libraries (approved, install only when phase needs them):

```text
- cmdk → CommandMenu (Phase 03 / 13)
- sonner → Toasts (Phase 03, replaces custom toast)
- vaul → Drawer / mobile sheets (Phase 13)
- framer-motion → micro-animations, RSVP transitions, panel transitions (Phase 10 / 13)
- react-hook-form + zod + @hookform/resolvers → settings / forms (Phase 13 / 14)
- next-themes → theme switching (class strategy) (Phase 03)
- class-variance-authority + clsx + tailwind-merge → variant system (Phase 03)
```

Rules:

- No other component library (no MUI, Chakra, Mantine, AntD, DaisyUI). Custom reader-specific components (`ReaderControls`, `DocumentCard`, `Highlight`, etc.) are built on top of shadcn/Radix + Tailwind in `packages/ui`.
- `packages/ui` owns all shadcn components, Tailwind preset/theme tokens, and reader tokens. Apps only import from `@locked-in/ui` — never copy-paste shadcn components per-app.
- Tailwind config/preset lives in `packages/ui` (or `packages/config` re-exported by `packages/ui`) so web + extension + docs share identical tokens.
- Dark/light + sepia/night reader themes via CSS variables + `class` dark mode. Reader tokens (`reader-background`, `reader-text`, etc.) are CSS variables scoped under `.reader-*`.

---

# 3. Dependency Graph

The 20 phases are intentionally not purely sequential.

```text
PHASE 01
Foundation
   │
   ├──────────────┬───────────────┬────────────────┐
   ▼              ▼               ▼                ▼
02 Domain      03 UI System     04 Storage       05 Extension
   │              │               │                │
   └──────┬───────┘               │                │
          ▼                       │                │
      06 Document Engine ◄────────┘                │
          │                                        │
     ┌────┼─────────────┐                          │
     ▼    ▼             ▼                          ▼
07 EPUB 08 PDF       09 Web Extraction        Extension Integration
     │    │             │                          │
     └────┴──────┬──────┘                          │
                  ▼                                 │
             10 Reader Engine ◄────────────────────┘
                  │
         ┌────────┼──────────┐
         ▼        ▼          ▼
     11 Library 12 Notes   13 Audio
         │        │          │
         └────────┼──────────┘
                  ▼
             14 Sync/Auth
                  │
         ┌────────┴─────────┐
         ▼                  ▼
    15 Search          16 AI Layer
         │                  │
         └────────┬─────────┘
                  ▼
             17 Knowledge Base
                  │
                  ▼
             18 Local AI
                  │
                  ▼
          19 Self Hosting /
             Ecosystem
                  │
                  ▼
             20 Production
```

## Parallel work opportunities

```text
Foundation
   │
   ├── Domain Model
   ├── UI System
   ├── Storage
   └── Extension Shell
             │
             ▼
      Document Infrastructure
             │
      ┌──────┼───────┐
      │      │       │
     EPUB   PDF    Web
      │      │       │
      └──────┼───────┘
             ▼
       Reader Engine
             │
      ┌──────┼───────────────┐
      │      │               │
   Library  Audio       Auth/Sync
      │      │               │
      └──────┼───────────────┘
             ▼
        Search + AI
             │
        Knowledge Base
             │
        Local AI
             │
        Ecosystem
```

---

# 4. Agent Execution Rules

Every implementation agent working on a phase must follow these rules.

## Rule 1: Read before changing

Before modifying code:

1. Read `README.md`
2. Read the relevant architecture documentation
3. Inspect package boundaries
4. Inspect existing tests
5. Inspect git status
6. Inspect related phases
7. Identify existing abstractions before introducing new ones

Never overwrite architecture merely because a local implementation is easier.

## Rule 2: Preserve shared-core boundaries

Business logic must not be duplicated between:

- PWA
- Chrome extension
- services

If the same logic is required in two places, first ask whether it belongs in a shared package.

## Rule 3: Tests are part of the phase

A phase is not complete when the code compiles.

It is complete when:

- implementation exists
- tests exist
- type checking passes
- lint passes
- relevant builds pass
- documented acceptance criteria pass

## Rule 4: No speculative infrastructure

Do not introduce:

- Redis
- Kafka
- Kubernetes
- microservices
- vector databases
- complex event buses

unless a phase explicitly requires them.

Start simple.

## Rule 5: Local-first always wins

Cloud services must never become implicit requirements for core reading.

---

# PHASE 01 — Repository Foundation

## Objective

Turn the empty repository into a production-grade TypeScript monorepo.

## Deliverables

- pnpm workspace
- Turborepo
- TypeScript configuration
- ESLint
- Prettier
- Vitest
- Tailwind CSS v4 + shadcn/ui foundation in `packages/ui`
- basic CI
- conventional development scripts
- environment variable conventions
- package naming conventions
- initial documentation structure

## Target structure

```text
apps/
packages/
services/
docs/
scripts/
tests/
```

## Apps

Create:

```text
apps/web
apps/extension
apps/docs
```

The web application starts as a minimal React/Vite PWA shell with Tailwind v4 (`@tailwindcss/vite` plugin) + `next-themes` provider + `sonner` Toaster wired to `@locked-in/ui` styles. The extension (sidepanel/popup/options) reuses the same `@locked-in/ui` styles/tokens — Tailwind content globs must include `packages/ui` and `apps/extension` so classes are not purged.

## Packages

Initially create only:

```text
packages/types
packages/core
packages/ui        # Tailwind preset + shadcn/ui + cn() + reader tokens
packages/config
packages/testing
```

`packages/ui` setup in Phase 01 (do not defer):

```text
packages/ui/
├── app/globals.css or src/globals.css  # tailwind import + shadcn CSS vars + reader vars
├── components/ui/  # button, input, dialog, popover, tooltip, tabs, dropdown-menu, slider, progress, sheet, sonner, command, etc.
├── lib/utils.ts    # cn() (clsx + tailwind-merge)
├── tailwind preset / theme tokens
└── package.json exports @locked-in/ui
```

Install in Phase 01: `tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react next-themes sonner cmdk`. shadcn components are vendored into `packages/ui/components/ui` (not installed as a dependency).

## CI

GitHub Actions should run:

```text
install
typecheck
lint
test
build
```

## Acceptance criteria

- `pnpm install` works
- `pnpm dev` starts web and extension development
- `pnpm build` works
- `pnpm test` works
- `pnpm lint` works
- CI is green
- repository has a clear contributor guide

---

# PHASE 02 — Domain Model and Contracts

## Objective

Define the canonical domain model before feature development accelerates.

## Core entities

```text
User
Document
DocumentBlock
DocumentAsset
DocumentSource
DocumentMetadata
Collection
Tag
Highlight
Note
Bookmark
ReadingProgress
ReadingSession
Theme
ReadingPreset
AudioDocument
AudioSegment
SyncChange
```

## Canonical document

```ts
Document {
  id: DocumentId
  source: DocumentSource
  metadata: DocumentMetadata
  structure: DocumentStructure
  blocks: DocumentBlock[]
  assets: DocumentAsset[]
}
```

## Block types

```text
heading
paragraph
quote
list
list-item
code
image
table
divider
footnote
caption
```

## Stable location model

Annotations and progress must reference canonical document locations rather than DOM coordinates.

Example:

```text
documentId
blockId
startOffset
endOffset
```

## Acceptance criteria

- schemas defined
- runtime validation exists
- serialization/deserialization tests
- IDs and timestamps standardized
- versioning strategy documented

---

# PHASE 03 — Design System and UI Foundation (Tailwind + shadcn/ui)

## Objective

Create a premium reading-first design system shared by web and extension, built on Tailwind CSS v4 + shadcn/ui + Radix primitives. No bespoke component library — shadcn is the base, custom work is reader-specific composition on top.

## Requirements

Build in `packages/ui` (shadcn-style, Radix-based, `cn()` variants):

```text
Base (shadcn/ui, vendored):
Button, Input, Textarea, Label, Dialog, AlertDialog, Popover, Tooltip,
Tabs, DropdownMenu, Select, Slider, Progress, Switch, Checkbox, RadioGroup,
Sheet (vaul-compatible), Separator, ScrollArea, Avatar, Badge, Card,
Skeleton, Sonner (toast), Command (cmdk)

Custom (built on base + Tailwind, owned by Locked In):
Sidebar, Toolbar, ReaderControls, DocumentCard, LibraryCard,
Highlight, AnnotationPopover, Stat, EmptyState, ThemeSwitcher
```

Use companions:

```text
- lucide-react for all icons (no emoji icons, no other icon set)
- cmdk via shadcn Command for CommandMenu
- sonner for Toast (no custom toast system)
- vaul for mobile Drawer sheets
- framer-motion only for meaningful motion (panel/RSVP transitions)
- react-hook-form + zod for Settings/forms (Phase 13/14 reuse)
```

## Typography system

Support:

- serif
- sans
- monospace
- system fonts
- user-configurable font stacks

## Theme system (Tailwind v4 CSS variables + next-themes)

Implement shadcn CSS-variable tokens in `packages/ui` globals (light `:root` + `.dark`), consumed via Tailwind theme. Define semantic tokens:

```text
background / foreground
card / card-foreground
popover / popover-foreground
primary / primary-foreground
secondary / secondary-foreground
muted / muted-foreground
accent / accent-foreground
destructive
border / input / ring
chart-1..5, sidebar-*
--radius, --font-sans, --font-serif, --font-mono
```

Dark mode: `class` strategy via `next-themes` (`attribute="class"`, `defaultTheme="system"`). Product themes: light / dark / sepia / night-owl mapped to variable overrides. Never hardcode colors in apps — always use tokens (`bg-background text-foreground border-border`, etc.).

## Reader-specific tokens

```text
reader-background
reader-text
reader-focus
reader-highlight
reader-width
reader-font-size
reader-line-height
```

## Acceptance criteria

- `@locked-in/ui` consumed by web AND extension (no duplicated shadcn copies)
- Tailwind builds in both apps with shared preset; no purged/missing styles
- theme switching (light/dark/sepia) works via `next-themes`, persisted
- dark/light themes work, contrast-checked for reader text
- keyboard navigation + Radix focus management works
- `cn()` + `cva` variant system used for all custom components
- visual primitives have tests where appropriate
- Storybook or equivalent component documentation exists (`apps/docs` or Storybook in `packages/ui`)

---

# PHASE 04 — Local Storage and Repository Layer

## Objective

Build local-first persistence before cloud sync.

## Storage abstraction

```ts
interface StorageAdapter {
  get()
  set()
  delete()
  list()
  transaction()
}
```

Implement:

```text
IndexedDB adapter
OPFS/file adapter where useful
in-memory adapter for tests
```

## Repository layer

```text
DocumentRepository
LibraryRepository
AnnotationRepository
ProgressRepository
SettingsRepository
SessionRepository
```

The UI should never directly manipulate IndexedDB.

## Requirements

- schema versioning
- migrations
- transactions
- corruption-safe writes
- storage quota handling
- graceful failures

## Acceptance criteria

A user can:

- import a document
- close the app
- reopen it
- find the document
- retain progress
- retain settings
- retain annotations

without an account or network.

---

# PHASE 05 — Chrome Extension Foundation

## Objective

Build the MV3 architecture.

Chrome's Side Panel API supports persistent extension UI alongside webpages and is available for MV3 extensions, making it suitable for Locked In's browser companion. citeturn0search1

## Structure

```text
extension/
├── manifest.json
├── service-worker/
├── content/
├── sidepanel/
├── popup/
└── options/
```

## Responsibilities

### Content script

- page interaction
- selection detection
- DOM extraction hooks

### Service worker

- extension events
- context menus
- messaging
- storage coordination
- side panel control

### Side panel

- current page actions
- save
- read
- speed read
- library access
- built with `@locked-in/ui` (shadcn Button/Card/Sheet/Sonner) + shared Tailwind tokens; no separate extension CSS system

## Important MV3 constraint

Do not depend on a persistent background process. MV3 service workers are event-driven, and DOM-dependent work should use content scripts or appropriate offscreen documents. citeturn0search11

## Acceptance criteria

- extension loads unpacked
- toolbar action works
- side panel opens
- context menu works
- messaging between content script and service worker works
- messaging to side panel works
- no remote code execution
- permissions are minimal

---

# PHASE 06 — Canonical Document Engine

## Objective

Build the ingestion-neutral document representation.

## Pipeline

```text
Input
  ↓
Parser
  ↓
Normalizer
  ↓
Canonical Document
  ↓
Validation
  ↓
Storage
```

## Requirements

- deterministic normalization
- block IDs
- source metadata
- asset references
- headings
- paragraph boundaries
- links
- images
- lists
- code blocks

## Critical requirement

Every parser must produce the same canonical representation.

```text
EPUB ──┐
PDF ───┤
HTML ──┤──→ CanonicalDocument
TXT ───┤
MD ────┘
```

## Acceptance criteria

Fixtures exist for each supported document type.

The same canonical reader can render all fixtures.

---

# PHASE 07 — EPUB Engine

## Objective

Make EPUB a first-class book format.

## Features

- EPUB import
- ZIP/container handling
- OPF metadata
- manifest
- spine
- TOC
- chapters
- images
- CSS handling
- chapter boundaries
- metadata extraction
- progress mapping

## Book model

```text
Book
├── metadata
├── chapters
├── assets
├── toc
└── document
```

## Edge cases

Handle:

- malformed EPUBs
- missing metadata
- RTL text
- CJK text
- embedded fonts
- large books
- encrypted/protected content by refusing unsupported protected formats rather than bypassing protection
- malformed HTML
- duplicate IDs

## Acceptance criteria

- multiple real-world EPUB fixtures
- chapter navigation
- TOC
- metadata
- reading progress
- highlights
- speed reader compatibility

---

# PHASE 08 — PDF Engine

## Objective

Support PDF as both a visual document and a reflowable reading source.

## Two representations

```text
PDF
├── Original View
└── Extracted Text View
```

## Features

- local PDF import
- page rendering
- page navigation
- text extraction
- page-to-text mapping
- search
- document metadata
- annotations
- reading mode

## Scanned PDF strategy

Do not require OCR in this phase.

Create the OCR abstraction:

```ts
interface OCRProvider {
  recognize(input): Promise<OCRResult>
}
```

Implement OCR later.

## Acceptance criteria

- text PDFs work
- page navigation works
- text can be reflowed
- page references remain available
- imported PDFs work offline
- large PDFs don't freeze the UI

---

# PHASE 09 — Web Extraction and Browser Capture

## Objective

Turn webpages into canonical documents.

## Pipeline

```text
Web Page
   ↓
Content Script
   ↓
Extractor
   ↓
Cleaner
   ↓
Canonical Document
```

## Extraction layers

```text
1. Generic DOM extraction
2. Reader-mode heuristics
3. Site adapters
4. User selection fallback
5. Manual text fallback
```

## Site adapter architecture

```text
extractors/
├── generic
├── github
├── wikipedia
├── medium
├── substack
└── custom
```

Do not promise universal website compatibility.

## Extension actions

```text
Read now
Speed read
Save
Listen
Add to collection
```

## Acceptance criteria

Test against:

- news article
- blog
- documentation
- GitHub
- long-form article
- dynamically rendered page
- page with navigation clutter
- page with paywall/sign-in limitations
- selection-only content

---

# PHASE 10 — Reading Engine

## Objective

Build the core speed-reading engine as framework-independent TypeScript.

This is one of the most important packages in the entire project.

## Package

```text
@locked-in/reader-engine
```

It must have zero React dependency.

## Modes

### Normal

Canonical document renderer.

### RSVP

One word/chunk at a time.

### ORP

Optimal recognition point.

### Chunk

Configurable word groups.

### Guided

Sentence/paragraph highlighting.

## Pacing engine

```text
base WPM
+
punctuation adjustment
+
word-length adjustment
+
number adjustment
+
heading pause
+
paragraph pause
+
custom timing
```

## API

Conceptually:

```ts
reader.load(document)
reader.play()
reader.pause()
reader.seek(position)
reader.setMode(mode)
reader.setSpeed(wpm)
reader.next()
reader.previous()
```

## Acceptance criteria

- deterministic playback
- accurate WPM
- seekable
- pause/resume
- keyboard controls
- long-word handling
- punctuation timing
- paragraph pauses
- RTL handling
- CJK handling
- code-block behavior
- unit tests for timing calculations

---

# PHASE 11 — Library, Highlights, Notes and Reading Sessions

## Objective

Turn the reader into a persistent reading workspace.

## Library

```text
Inbox
Continue Reading
Books
Articles
Papers
Archive
```

## Collections

Documents can belong to multiple collections.

## Tags

Support user tags without making tags the primary organization mechanism.

## Highlights

Stable canonical offsets.

## Notes

Attach notes to:

- documents
- highlights
- collections

## Sessions

Record locally:

```text
mode
start
end
words read
WPM
position
document
```

## Acceptance criteria

A complete workflow works:

```text
Import
→ Read
→ Highlight
→ Note
→ Close
→ Reopen
→ Continue
```

---

# PHASE 12 — Audio Engine

## Objective

Make listening a first-class modality without coupling it to one AI provider.

## Architecture

```text
Text
 ↓
AudioProvider
 ↓
AudioSegments
 ↓
AudioTimeline
 ↓
AudioPlayer
```

## Support two modes

### Instant TTS

Browser/OS TTS.

### Generated audio

Provider-generated audio.

## Audio segment model

```text
AudioSegment {
  id
  documentId
  startOffset
  endOffset
  text
  audioAsset
  duration
  timestamps
}
```

## Synchronization

Support:

```text
audio
 ↕
sentence
 ↕
word
 ↕
document offset
```

when timestamp data exists.

## Acceptance criteria

- TTS works
- play/pause
- seek
- speed control
- progress persistence
- background-friendly web behavior where supported
- text highlighting during playback
- no AI dependency for basic TTS

---

# PHASE 13 — PWA Completion and Reading UX

## Objective

Bring all capabilities together into a polished application.

## Screens (all composed from `@locked-in/ui` shadcn + Tailwind)

```text
Home (Card/Skeleton)
Library (DocumentCard/LibraryCard + Tabs/Select)
Reader (reader tokens + Toolbar/ReaderControls)
Speed Reader (Slider/Progress/Sheet + framer-motion)
Book (ScrollArea/TOC Sheet)
Highlights / Notes (Card/Popover/Command)
Search (Command/cmdk + Tabs)
Settings (Form/react-hook-form+zod + Switch/Slider/Select)
Themes (ThemeSwitcher + next-themes)
Reading Statistics (Progress/Chart tokens)
```

## PWA

Implement:

- installability
- service worker
- offline shell
- cached application assets
- offline reading
- offline settings
- offline annotations

## Reader UX

Prioritize:

- typography
- low visual noise
- keyboard shortcuts
- responsive layouts
- mobile reading
- desktop reading
- distraction-free mode

## Acceptance criteria

The PWA can function for a complete reading session with no network.

---

# PHASE 14 — Auth0, Cloud Sync and Cloud Storage

## Objective

Add optional identity and synchronization.

## Authentication

Anonymous first.

Auth0 only when user chooses cloud features.

## Cloud model

```text
Local State
    │
    ▼
Change Log
    │
    ▼
Sync Engine
    │
    ▼
Cloud
```

## Cloud stack

Use Vercel as deployment infrastructure with a managed Postgres provider through the Vercel ecosystem. Neon is currently available through Vercel Marketplace and provides serverless Postgres, branching, autoscaling and related capabilities. citeturn0search0turn0search3

Use object storage such as Vercel Blob for cloud document assets where appropriate.

## Sync requirements

Sync:

- documents metadata
- collections
- tags
- highlights
- notes
- reading progress
- themes
- presets
- settings

Large binary documents should be handled separately from metadata.

## Conflict strategy

Design deterministic conflict resolution.

Never silently overwrite a user's annotation.

## Acceptance criteria

```text
Device A
→ login
→ import
→ highlight

Device B
→ login
→ sync
→ sees highlight
```

Offline edits must sync when connectivity returns.

---

# PHASE 15 — Search Engine

## Objective

Make the personal library deeply searchable.

## Search layers

```text
Exact
 ↓
Full text
 ↓
Metadata
 ↓
Semantic
 ↓
Hybrid ranking
```

## MVP search

Use Postgres full-text search.

## Semantic architecture

Define:

```ts
EmbeddingProvider
VectorStore
SemanticSearch
HybridSearch
```

Do not hard-code a hosted vector provider.

## Search scope

```text
Current document
Book
Collection
All library
Highlights
Notes
```

## Acceptance criteria

Search can find:

- title
- author
- body text
- highlights
- notes
- tags
- metadata

---

# PHASE 16 — AI Document Intelligence

## Objective

Introduce AI without compromising local-first principles.

## AI abstraction

```text
AIProvider
├── generate
├── summarize
├── embed
├── extract
├── classify
└── generateAudio
```

## Features

### Document summary

### Explain selection

### Ask document

### Extract key points

### Generate tags

### Generate reading questions

### Compare selected documents

## Provider support

Architecture should permit:

```text
OpenAI
Anthropic
Google
Azure
OpenRouter
Ollama
Local
Custom
```

## BYOK

Users should eventually be able to supply their own provider credentials.

## Acceptance criteria

Every AI answer must identify its context.

AI must never silently claim that a generated answer came from a source.

---

# PHASE 17 — Personal Knowledge Base

## Objective

Turn the library into a searchable personal knowledge system.

## Main feature

```text
ASK MY LIBRARY
```

Example:

```text
What have I read about agent memory?
```

## Retrieval pipeline

```text
Question
   ↓
Query analysis
   ↓
Hybrid search
   ↓
Reranking
   ↓
Relevant chunks
   ↓
LLM
   ↓
Grounded answer
   ↓
Citations
```

## Context scopes

```text
This paragraph
This document
This book
This collection
Entire library
```

## Related content

Show:

```text
Related documents
Related highlights
Related notes
Related concepts
```

## Acceptance criteria

- answers cite source documents
- source links jump to exact locations
- retrieval is deterministic enough to test
- user can inspect retrieved context
- no hidden library access outside selected scope

---

# PHASE 18 — Local AI Runtime and AI Audio

## Objective

Make privacy-preserving local intelligence a first-class capability.

## Local AI

Support adapters for:

```text
Ollama
llama.cpp
WebGPU-capable models
Local embeddings
Local OCR
Local TTS
```

Do not require these runtimes to be installed for normal operation.

## Local audiobook pipeline

```text
Document
   ↓
Text normalization
   ↓
Narration planning
   ↓
Local LLM
   ↓
Local TTS
   ↓
Audio segments
   ↓
Timeline
   ↓
Offline audiobook
```

## Audio intelligence

Eventually support:

- pronunciation normalization
- numbers/date normalization
- code-aware narration
- headings
- quotations
- pauses
- emphasis
- chapter transitions

## Acceptance criteria

A supported local runtime can process a document without sending its content to a cloud provider.

---

# PHASE 19 — Self-Hosting, Plugin System and Open Ecosystem

## Objective

Make Locked In a platform rather than a single hosted application.

## Self-hosting

Target:

```text
docker compose up
```

with:

```text
web
api
postgres
storage
search
optional AI
```

## Configuration

Infrastructure should be replaceable:

```text
DatabaseAdapter
StorageAdapter
AIProvider
EmbeddingProvider
TTSProvider
MetadataProvider
```

## Plugin system

Potential extension points:

```text
Importers
Extractors
Exporters
Themes
Reading Modes
AI Providers
TTS Providers
Metadata Providers
```

## Community documentation

Create:

```text
CONTRIBUTING.md
ARCHITECTURE.md
PLUGIN_DEVELOPMENT.md
SELF_HOSTING.md
AI_PROVIDERS.md
THEMES.md
```

## Acceptance criteria

A technically competent developer can:

1. clone repository
2. run locally
3. understand architecture
4. create a plugin
5. run the complete application
6. replace an AI provider
7. replace storage

---

# PHASE 20 — Production Hardening, Release and Long-Term Platform

## Objective

Turn the implementation into a reliable open-source product.

## Security

Audit:

- XSS
- malicious HTML
- malicious EPUB content
- PDF parsing
- URL extraction
- extension permissions
- authentication
- authorization
- API abuse
- file uploads
- SSRF
- prompt injection
- AI-generated content
- secrets
- cloud storage access

## Performance

Measure:

```text
first load
document import
EPUB parse
PDF parse
reader startup
RSVP latency
search latency
sync latency
AI retrieval
audio startup
```

## Large document testing

Test:

```text
10 MB
50 MB
100 MB+
large EPUB
large PDF
100k+ word documents
```

## Browser testing

At minimum:

```text
Chrome
Edge
Brave
```

Prepare architecture for:

```text
Firefox
Safari
```

## Release engineering

Implement:

- semantic versioning
- changelog
- GitHub Releases
- extension packaging
- PWA deployment
- migration system
- rollback procedures
- feature flags where needed

## Observability

Hosted deployment should have:

- errors
- performance
- API failures
- sync failures
- ingestion failures

without collecting unnecessary reading content.

## Final acceptance

The product must support this complete journey:

```text
Web Article
    ↓
Chrome Extension
    ↓
Extract
    ↓
Save
    ↓
PWA Library
    ↓
Read
    ↓
Speed Read
    ↓
Highlight
    ↓
Note
    ↓
Close
    ↓
Sync
    ↓
Search
    ↓
Ask AI
    ↓
Find Related Source
    ↓
Listen
    ↓
Generate Offline Audio
    ↓
Continue Reading Later
```

---

# 5. Cross-Phase Quality Gates

Every phase must pass these gates.

## Gate A — Type safety

```bash
pnpm typecheck
```

## Gate B — Lint

```bash
pnpm lint
```

## Gate C — Unit tests

```bash
pnpm test
```

## Gate D — Build

```bash
pnpm build
```

## Gate E — Integration

Relevant end-to-end tests must pass.

## Gate F — Documentation

Every architectural feature must document:

- what it does
- why it exists
- package ownership
- public interfaces
- known limitations

---

# 6. Agent Phase Completion Contract

An agent working on a phase must produce:

```text
1. Implementation
2. Tests
3. Documentation
4. Migration if needed
5. Architecture decision if needed
6. Validation report
```

The validation report should contain:

```text
Phase:
Status:

Implemented:
- ...

Tests:
- ...

Commands:
- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm build

Known limitations:
- ...

Files changed:
- ...

Next phase dependencies:
- ...
```

Never mark a phase complete if the build is broken.

---

# 7. Phase Dependency Matrix

| Phase | Depends On | Can Run Parallel With |
|---|---|---|
| 01 Foundation | None | None |
| 02 Domain | 01 | 03, 04, 05 |
| 03 UI | 01 | 02, 04, 05 |
| 04 Storage | 01, 02 | 03, 05 |
| 05 Extension | 01, 03 | 02, 04 |
| 06 Document Engine | 02, 04 | 03, 05 |
| 07 EPUB | 06 | 08, 09 |
| 08 PDF | 06 | 07, 09 |
| 09 Web Extraction | 05, 06 | 07, 08 |
| 10 Reader Engine | 02, 06 | 07, 08, 09 |
| 11 Library | 02, 04, 06, 10 | 12, 13 |
| 12 Audio | 06, 10 | 11 |
| 13 PWA UX | 03, 06, 10, 11 | 12 |
| 14 Auth/Sync | 04, 11 | 12, 15 |
| 15 Search | 06, 11 | 12, 14 |
| 16 AI | 06, 15 | 14 |
| 17 Knowledge Base | 15, 16 | 18 |
| 18 Local AI | 16, 17 | 19 |
| 19 Ecosystem | 14, 16, 18 | 20 preparation |
| 20 Production | All required phases | None |

---

# 8. Recommended Agent Parallelization

When the project reaches Phase 02, work can be split into specialized agents.

```text
                         ORCHESTRATOR
                              │
             ┌────────────────┼─────────────────┐
             │                │                 │
             ▼                ▼                 ▼
       Foundation Agent   Reader Agent      Platform Agent
             │                │                 │
        Domain/UI          EPUB/PDF         Storage/Sync
             │                │                 │
             └────────────────┼─────────────────┘
                              │
                              ▼
                        Integration Agent
                              │
                              ▼
                           QA Agent
```

Later:

```text
                           ORCHESTRATOR
                                │
      ┌─────────────┬───────────┼─────────────┬─────────────┐
      │             │           │             │             │
      ▼             ▼           ▼             ▼             ▼
   Reader        Documents    Extension      AI          Platform
   Agent          Agent        Agent         Agent         Agent
      │             │           │             │             │
      └─────────────┴───────────┼─────────────┴─────────────┘
                                ▼
                         Integration Agent
                                │
                                ▼
                           QA / E2E Agent
                                │
                                ▼
                         Release Agent
```

---

# 9. Future Orchestrator Contract

The future orchestrator should not simply say:

> "Build Phase 7."

It should understand:

```text
phase
dependencies
affected packages
required interfaces
acceptance criteria
tests
artifacts
risk
parallelization
```

A phase definition should eventually look conceptually like:

```yaml
phase: 07
name: EPUB Engine

depends_on:
  - 06

parallelizable_with:
  - 08
  - 09
  - 10

owns:
  - packages/epub

consumes:
  - "@locked-in/document-engine"
  - "@locked-in/types"

produces:
  - EPUB parser
  - metadata extractor
  - chapter model

acceptance:
  - EPUB import works
  - TOC works
  - metadata works
  - progress mapping works
  - tests pass

commands:
  - pnpm test --filter @locked-in/epub
  - pnpm typecheck
  - pnpm build
```

This makes the 20 phases machine-readable later.

---

# 10. Definition of Done for the Entire Product

Locked In should not be considered "done" merely because the web app opens.

The end-to-end definition is:

```text
┌───────────────────────────────────────────────────────┐
│                    LOCKED IN                          │
├───────────────────────────────────────────────────────┤
│                                                       │
│  CAPTURE                                               │
│  Web → Extension → Canonical Document                 │
│                                                       │
│  IMPORT                                                │
│  EPUB / PDF / Markdown / TXT / HTML                  │
│                                                       │
│  READ                                                  │
│  Beautiful customizable reader                        │
│                                                       │
│  SPEED READ                                            │
│  RSVP / ORP / Chunk / Guided                           │
│                                                       │
│  ANNOTATE                                              │
│  Highlights / Notes / Bookmarks                        │
│                                                       │
│  LISTEN                                                │
│  TTS / AI Audio / synchronized text                   │
│                                                       │
│  STORE                                                 │
│  Local-first library                                   │
│                                                       │
│  SYNC                                                  │
│  Optional Auth0 + cloud                               │
│                                                       │
│  SEARCH                                                │
│  Full-text + semantic                                 │
│                                                       │
│  UNDERSTAND                                            │
│  AI document assistant                                 │
│                                                       │
│  CONNECT                                               │
│  Personal knowledge base                               │
│                                                       │
│  LOCAL AI                                              │
│  Local LLM / embeddings / TTS / OCR                   │
│                                                       │
│  EXTEND                                                │
│  Plugins / themes / providers                          │
│                                                       │
│  SELF-HOST                                              │
│  Docker + replaceable infrastructure                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

# 11. The North-Star Architectural Rule

Whenever a future feature is proposed, ask:

> **Does this belong to the document, reading, annotation, knowledge, AI, storage, or client layer?**

Then put it there.

Do not put business logic into:

```text
apps/web
```

just because it is convenient.

Do not put browser-specific logic into:

```text
packages/core
```

just because the extension needs it.

Do not make cloud services mandatory for functionality that can operate locally.

Do not make AI mandatory for deterministic reading functionality.

---

# 12. Final Development Order

The shortest reliable path to a working product is:

```text
01 Foundation
      ↓
02 Domain
      ↓
03 UI ─────────────┐
      ↓            │
04 Storage         │
      ↓            │
05 Extension ──────┤
      ↓            │
06 Document Engine │
      ↓            │
 ┌────┼────┐       │
 ▼    ▼    ▼       │
07   08   09       │
EPUB PDF  WEB      │
 └────┼────┘       │
      ▼            │
10 Reader ─────────┘
      ↓
11 Library
      ├──────────────┐
      ▼              ▼
12 Audio          13 PWA UX
      │              │
      └──────┬───────┘
             ▼
14 Auth + Sync
             │
       ┌─────┴─────┐
       ▼           ▼
15 Search       16 AI
       │           │
       └─────┬─────┘
             ▼
17 Knowledge Base
             │
             ▼
18 Local AI
             │
             ▼
19 Ecosystem
             │
             ▼
20 Production
```

---

# 13. Product Milestones

## Milestone 1 — Foundation

**Phases 01–06**

Result:

> A real monorepo with a canonical document model, local storage, UI system and extension foundation.

---

## Milestone 2 — Reader

**Phases 07–10**

Result:

> Users can import EPUB/PDF/web content and read or speed-read it.

This is the first genuinely usable Locked In.

---

## Milestone 3 — Personal Reader

**Phases 11–13**

Result:

> Users can build a local reading library, annotate content and listen to it.

---

## Milestone 4 — Connected Reader

**Phases 14–16**

Result:

> Users can optionally sync their library and use search and AI.

---

## Milestone 5 — Knowledge System

**Phases 17–18**

Result:

> Locked In understands the user's reading library and can operate with local AI.

---

## Milestone 6 — Open Platform

**Phases 19–20**

Result:

> Locked In becomes a self-hostable, extensible open-source reading platform.

---

# 14. The End State

The final architecture should allow this:

```text
                     ANY INPUT
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
      Web              EPUB              PDF
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                  CANONICAL DOCUMENT
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
        READ         SPEED READ       LISTEN
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                    ANNOTATIONS
                         │
                    ┌────┴────┐
                    ▼         ▼
                Highlights   Notes
                    │         │
                    └────┬────┘
                         ▼
                    LIBRARY
                         │
                ┌────────┴────────┐
                ▼                 ▼
             SEARCH              AI
                │                 │
                └────────┬────────┘
                         ▼
                 KNOWLEDGE BASE
                         │
                         ▼
                    LOCAL AI
                         │
                ┌────────┴────────┐
                ▼                 ▼
             PRIVATE           CLOUD
                │                 │
                └────────┬────────┘
                         ▼
                    USER OWNS IT
```

**That is the implementation plan I would use as the foundation for the future orchestrator.**

The important thing is that the 20 phases are not 20 arbitrary feature buckets. They form a dependency-aware path from an empty repository to the complete Locked In vision, while deliberately allowing EPUB, PDF, web extraction, UI, storage, extension and audio work to proceed in parallel where their contracts permit it.

The repository is currently empty, so **Phase 01 should be the first actual coding phase**. GitHub confirms the `GautamVhavle/LockedInReader` repository currently has no files. citeturn1view0

The monorepo choice is also aligned with the current Turborepo workflow: workspace dependencies can determine build order, while explicit `dependsOn` rules provide control over sequencing, caching and parallel execution. citeturn0search2turn0search8

