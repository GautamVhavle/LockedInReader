# Locked In Reader — Complete Product Vision

I think the product is now clear enough to define a real vision rather than just a feature list.

The key insight from looking at the current landscape is that the individual pieces already exist: SwiftRead has speed-reading modes and narration, Readwise Reader has a broad reading library with articles, newsletters, EPUBs, PDFs, annotations, search and AI, and open-source projects already demonstrate local-first RSVP, ORP, EPUB/PDF support, TTS and analytics. ([Chrome Web Store][1])

**Locked In should therefore not be positioned as "an open-source SwiftRead."**

It should be an **open-source personal reading system**.

---

# 1. The Vision

> **Locked In is an open-source, local-first reading workspace that lets people capture, read, speed-read, listen to, annotate, search, and understand everything they consume.**

It combines:

* SwiftRead-style speed reading
* Readwise Reader-style universal reading
* ebook reader
* PDF reader
* browser extension
* personal knowledge base
* AI research assistant
* AI-generated audio books
* local AI
* customizable reading environment
* cross-device synchronization
* open-source/self-hostable infrastructure

The long-term idea is simple:

> **Anything you read should become part of your personal knowledge system.**

And you should be able to consume that knowledge however you want.

```text
                         LOCKED IN
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
           READ          SPEED READ        LISTEN
             │               │               │
       normal reader       RSVP          AI audiobook
       ebook reader        ORP           TTS
       PDF reader          chunks        synced audio
             │               │               │
             └───────────────┼───────────────┘
                             │
                             ▼
                       ANNOTATE
                             │
                     ┌───────┴───────┐
                     │               │
                 Highlights         Notes
                     │               │
                     └───────┬───────┘
                             ▼
                       KNOWLEDGE BASE
                             │
              ┌──────────────┼──────────────┐
              │              │              │
            Search           AI          Connections
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                       YOUR KNOWLEDGE
```

---

# 2. The Core Product Philosophy

Locked In should be built around **five principles**.

## 1. Local-first

The application should work without an account.

You should be able to:

* install the extension
* open the PWA
* import a PDF
* import an EPUB
* save an article
* read
* speed-read
* highlight
* create notes
* customize everything

without creating an account.

An account is for **sync and cloud services**, not permission to use the reader.

---

## 2. Your data belongs to you

The default mental model should be:

```text
                 YOUR DATA

                    ↓

             ┌──────────────┐
             │ Local Device │
             └──────┬───────┘
                    │
             optional sync
                    │
                    ▼
             ┌──────────────┐
             │ Cloud Backup │
             └──────────────┘
```

A 500 MB book shouldn't mysteriously get uploaded simply because someone clicked "Open."

Cloud storage should be an **explicit choice**.

---

## 3. Everything is a document

The system should not fundamentally care whether the source was:

* a webpage
* PDF
* EPUB
* Markdown
* TXT
* DOCX
* academic paper
* newsletter
* RSS article
* YouTube transcript
* imported book

Everything becomes a canonical **Document**.

```text
EPUB ─────┐
PDF ──────┤
HTML ─────┤
Web ──────┤
TXT ──────┤
Markdown ─┤
DOCX ─────┤
YouTube ──┘
     │
     ▼
Canonical Document
     │
     ├── blocks
     ├── text
     ├── metadata
     ├── structure
     ├── assets
     └── source
```

That canonical representation is the foundation of the entire product.

---

## 4. Reading is multimodal

A document isn't tied to one reading mode.

The same document can become:

```text
Document
   │
   ├── Traditional reading
   │
   ├── RSVP
   │
   ├── ORP
   │
   ├── Chunk reading
   │
   ├── Guided highlighting
   │
   ├── TTS
   │
   └── AI audiobook
```

The progress and annotations remain attached to the underlying document.

---

## 5. Open by design

Locked In should be:

* open source
* documented
* extensible
* self-hostable
* provider-agnostic
* local-AI compatible
* storage-provider agnostic

Vercel can be the **official hosted infrastructure**, but it shouldn't become a technical prison.

---

# 3. Who Locked In Is For

The primary audience is **power readers**.

Not necessarily people who read 100 books a year.

People who consume enormous amounts of information.

For example:

### Developers

```text
GitHub
Documentation
RFCs
Blog posts
Research
Books
AI papers
```

### Researchers

```text
Papers
PDFs
Books
Notes
References
Highlights
```

### Students

```text
Textbooks
Lecture notes
Research papers
Articles
Books
```

### Knowledge workers

```text
Reports
Articles
Newsletters
Documents
Research
```

### Founders / executives

```text
Market reports
Books
Research
News
Long-form articles
```

The common problem:

> **There is too much information and too many places to consume it.**

Locked In creates one environment for it.

---

# 4. The Product Loop

The fundamental product loop should be:

```text
DISCOVER
   ↓
CAPTURE
   ↓
READ
   ↓
UNDERSTAND
   ↓
ANNOTATE
   ↓
REMEMBER
   ↓
CONNECT
   ↓
REUSE
```

For example:

```text
You discover an article.

        ↓

Locked In captures it.

        ↓

You speed-read it at 550 WPM.

        ↓

You highlight an important section.

        ↓

You add a note.

        ↓

AI connects it to something
you read three months ago.

        ↓

You later ask:

"What have I learned about RAG evaluation?"

        ↓

Locked In answers using your
own reading history.
```

That's the long-term magic.

---

# 5. The Reader

The reader itself should feel **extremely polished**.

Not like a browser page.

Not like a PDF viewer.

Not like a generic React application.

It should feel like a dedicated reading instrument.

---

## Normal reading

A clean typography-first environment.

```text
                     The Future of AI

               Author Name · 12 min read

────────────────────────────────────────────────

The development of artificial intelligence
has fundamentally changed the way software
is created...

       [highlight]       [note]

────────────────────────────────────────────────
```

Everything unnecessary disappears.

---

# 6. Speed Reading

This is one of the flagship features.

The first-class speed-reading modes should include:

### RSVP

```text
               │
               │
             read
               │
               │
```

One word at a time.

---

### ORP

```text
          international
                ↑
              focal
              point
```

The recognition point remains fixed.

Open-source readers already demonstrate ORP + adaptive timing as a viable implementation pattern. ([GitHub][2])

---

### Chunk mode

```text
┌───────────────────────────┐
│ The future of artificial  │
│ intelligence depends on   │
│ how we build systems.    │
└───────────────────────────┘
```

---

### Guided mode

```text
Artificial intelligence is transforming
software development.
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

Progressively highlights the reading flow.

---

# 7. Intelligent Pacing

This is where Locked In should go beyond a simple WPM slider.

Instead of:

```text
500 WPM
```

we eventually have:

```text
Base speed                500 WPM

Long words                 +12%
Numbers                    +15%
Technical terminology      +20%
Comma                      +120ms
Sentence                   +350ms
Paragraph                  +600ms
Quote                      +250ms
Code                       pause
Heading                    pause
```

The user can tune everything.

And eventually:

```text
Adaptive Speed: ON

Easy content       → 600 WPM
Normal content     → 500 WPM
Complex content    → 420 WPM
Technical content  → 350 WPM
```

But **adaptive speed should always be optional**.

---

# 8. Reading Presets

Users should be able to save complete reading environments.

For example:

```text
My Presets

⚡ Speed Training
   700 WPM
   ORP
   Minimal UI

📚 Books
   450 WPM
   Chunk mode
   Serif font

🧠 Research
   350 WPM
   Guided highlighting
   Larger line height

🌙 Night
   400 WPM
   Dark theme
   Warm background

💻 Technical
   350 WPM
   Monospace code
   Extra terminology pause
```

This becomes an ecosystem of user-created reading configurations.

---

# 9. Deep Customization

Locked In should treat customization as a first-class feature.

Users can control:

### Typography

* font
* font size
* weight
* line height
* letter spacing
* paragraph spacing
* reading width
* margins

### Visuals

* background
* text
* accent
* focus point
* highlights
* selection
* progress indicator

### Reading

* WPM
* ORP
* chunk size
* pacing
* punctuation pauses
* paragraph pauses
* adaptive timing

### Interface

* controls
* sidebar
* toolbar
* keyboard shortcuts
* distraction-free mode
* animations

And eventually users can create and share themes.

---

# 10. Accessibility

Accessibility shouldn't be a separate afterthought.

The rendering engine should support:

* dyslexia-friendly fonts
* bionic reading
* adjustable contrast
* font scaling
* reduced motion
* keyboard-only operation
* screen-reader compatibility
* focus mode
* color-blind-safe themes
* reading rulers
* customizable spacing

Existing open-source speed readers already demonstrate demand for features such as OpenDyslexic, Irlen overlays and other accessibility-focused modes. ([GitHub][2])

---

# 11. Universal Document Support

The long-term reader should support:

```text
Web
HTML
Markdown
TXT
PDF
EPUB
DOCX
RSS
Newsletters
YouTube transcripts
Academic papers
```

But the architecture should not treat them equally.

There should be a document ingestion pipeline.

```text
SOURCE
  │
  ▼
DETECT
  │
  ▼
EXTRACT
  │
  ▼
NORMALIZE
  │
  ▼
STRUCTURE
  │
  ▼
ENRICH
  │
  ▼
CANONICAL DOCUMENT
```

---

# 12. PDF

PDF should have two experiences.

## Original PDF

Preserve the actual layout.

## Reading mode

Extract and reflow the content.

```text
                  PDF
                   │
             ┌─────┴─────┐
             │           │
          Original     Reflow
             │           │
             │           ▼
             │      Speed Reader
             │
             ▼
          PDF Viewer
```

This is particularly important for research papers.

---

# 13. EPUB

EPUB should be a first-class book format.

A book should retain:

```text
Book
├── Cover
├── Title
├── Author
├── Metadata
├── Chapters
├── Sections
├── Images
├── Progress
├── Highlights
├── Notes
└── Bookmarks
```

You should be able to switch:

```text
Book
 ↓
Traditional Reader
 ↓
Speed Reader
 ↓
Audio
```

without losing your position.

---

# 14. Metadata

When importing an EPUB, PDF or other book-like document:

```text
Title
Author
ISBN
Publisher
Publication date
Cover
Description
Language
Genres
Series
```

should be detected where possible.

But metadata must remain editable.

Never assume an external metadata source is correct.

---

# 15. The Chrome Extension

The extension should not be "the app."

It should be the **capture and browser integration layer**.

Chrome's Manifest V3 model uses service workers for background/event handling and content scripts for interacting with pages, with side panels available for persistent browser-side experiences. ([GitHub][3])

So:

```text
Chrome
│
├── Content Script
│     └── extract/interact with page
│
├── Service Worker
│     └── orchestration/events
│
├── Side Panel
│     └── quick reader/library controls
│
└── Reader
      └── shared Locked In engine
```

---

# 16. Extension UX

Imagine you're reading an article.

You click:

**Locked In**

You get:

```text
┌───────────────────────────┐
│ 🔒 Locked In              │
│                           │
│ The Future of AI          │
│ 14 min                    │
│                           │
│ [ Read ]                  │
│ [ Speed Read ]            │
│ [ Listen ]                │
│                           │
│ ───────────────────────   │
│                           │
│ + Save to Library         │
│ + Add to Collection       │
└───────────────────────────┘
```

Or:

**Select text → right click → Read with Locked In**

---

# 17. Extraction Architecture

Do not hardcode extraction logic into the extension.

Create:

```text
@locked-in/extraction
```

with:

```text
GenericExtractor
GitHubExtractor
MediumExtractor
SubstackExtractor
WikipediaExtractor
...
```

The generic extractor handles most pages.

Site-specific extractors handle difficult cases.

If extraction fails:

```text
Automatic extraction failed.

[Reader Mode]
[Select Text]
[Save Page]
[Copy Text]
```

Never leave the user stranded.

---

# 18. The Library

The library is where Locked In starts becoming Readwise-like.

But it should feel more like a **personal information system**.

Potential top-level views:

```text
Home
Inbox
Continue Reading
Books
Articles
Papers
Highlights
Notes
Collections
Tags
Archive
```

---

# 19. Collections

Collections should be flexible.

For example:

```text
AI

├── Agents
├── RAG
├── Evaluation
├── Memory
└── Multimodal
```

or:

```text
Startup Research

├── Markets
├── Product
├── Distribution
├── Fundraising
└── Competition
```

Don't force a rigid folder hierarchy.

Documents can belong to multiple collections.

---

# 20. Highlights

Highlights should become an important primitive.

```text
Document
   │
   └── Highlight
          │
          ├── text
          ├── location
          ├── createdAt
          ├── tags
          └── note
```

Highlights should survive changes in presentation.

You can read normally today and speed-read tomorrow without losing them.

---

# 21. Notes

Notes should support:

* plain text
* Markdown
* links
* references
* tags
* document references
* highlight references

Eventually:

```text
Highlight
    ↓
Note
    ↓
Concept
    ↓
Related documents
```

---

# 22. The Knowledge Base

This is one of the biggest long-term differentiators.

Everything you read contributes to your personal knowledge base.

```text
                   MY KNOWLEDGE

                       │
       ┌───────────────┼───────────────┐
       │               │               │
    Articles          Books           Papers
       │               │               │
       └───────────────┼───────────────┘
                       │
                  Highlights
                       │
                     Notes
                       │
                  Concepts
```

---

# 23. Search

Search should be hybrid.

Not:

```text
SELECT * WHERE text LIKE ...
```

and not embeddings-only.

Instead:

```text
                SEARCH
                   │
          ┌────────┴────────┐
          │                 │
      Full-text          Semantic
       search             search
          │                 │
          └────────┬────────┘
                   │
             Hybrid ranking
                   │
                   ▼
                Results
```

This allows:

> "vector databases"

to find exact mentions, while:

> "ways people store semantic representations"

can find conceptually related material.

---

# 24. AI Knowledge Assistant

The killer interaction:

> **Ask my library.**

Example:

> "What have I read about agent memory?"

Locked In responds:

```text
I found 14 relevant sources.

Your reading suggests three approaches:

1. Episodic memory
2. Semantic memory
3. Working/context memory

Sources:
────────────────────────────
Designing Agent Memory
Research Paper A
Your note from June 12
...
```

Every factual statement should be traceable to a source.

---

# 25. Context Scope

AI queries should have explicit scope:

```text
Ask

○ This paragraph
○ This document
○ This collection
○ This book
○ Everything I've read
```

This prevents the AI from mysteriously using unrelated information.

---

# 26. AI Actions

Eventually AI can:

### Explain

> Explain this paragraph.

### Summarize

> Summarize this paper.

### Compare

> Compare these two papers.

### Connect

> What else have I read related to this?

### Extract

> Extract the key arguments.

### Question

> What assumptions does this author make?

### Review

> Quiz me on this chapter.

### Search

> Find everything I've read about vector databases.

---

# 27. AI Reading Coach

Eventually Locked In understands the user's reading patterns.

It could say:

```text
You usually read technical papers comfortably
around 380-420 WPM.

This paper is significantly denser.

Recommended:
360 WPM
+ paragraph pauses
+ guided mode
```

But the user remains in control.

AI should **recommend**, not silently modify the reading experience.

---

# 28. Audio Is a First-Class Modality

This is one of the strongest additions to the vision.

A document can become an audiobook.

```text
                  DOCUMENT
                      │
             ┌────────┴────────┐
             │                 │
           TEXT              AUDIO
             │                 │
        Read/RSVP         TTS/Audiobook
```

---

# 29. Two Audio Modes

### Instant TTS

Fast:

```text
Text → Browser/OS TTS → playback
```

Useful for:

* immediately listening
* short articles
* quick previews

### Generated audiobook

```text
Document
   ↓
AI preprocessing
   ↓
Narration model
   ↓
Audio generation
   ↓
Segmented audiobook
```

Useful for:

* books
* long articles
* research
* offline listening

Readwise already demonstrates demand for AI-voice TTS across documents, so this is a natural extension of the reading experience rather than an unrelated feature. ([Readwise Docs][4])

---

# 30. Audio/Text Synchronization

This is where Locked In can become special.

```text
Audio
────────────────────────●────────────

"The development of artificial intelligence..."
                         ↑
                    currently spoken
```

The corresponding text is highlighted.

Ideally:

```text
Audio
  ↕
Sentence
  ↕
Word
  ↕
Document offset
```

This means audio playback, text selection, highlights and progress all share the same underlying document coordinates.

---

# 31. Local AI Audio

Long-term:

```text
                    LOCAL DEVICE

Document
    ↓
Local LLM
    ↓
Narration preparation
    ↓
Local TTS model
    ↓
Audiobook
```

No upload.

No cloud.

No subscription required.

This should be a major part of the open-source ecosystem.

---

# 32. AI Provider Architecture

The application should never depend directly on one AI vendor.

```text
                  AI INTERFACE
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    OpenAI         Anthropic         Gemini
       │               │                │
       ├───────────────┼────────────────┤
       │               │
     Ollama        Local Models
```

Vercel's current AI ecosystem also emphasizes provider abstraction and model switching through its AI SDK/Gateway, which aligns well with this architecture. ([Vercel][5])

But Locked In's own abstraction should remain independent of Vercel.

---

# 33. Local AI Runtime

Eventually:

```text
@locked-in/ai
       │
       ├── Cloud
       │
       ├── Ollama
       │
       ├── llama.cpp
       │
       ├── WebGPU
       │
       └── Custom local runtime
```

A user could configure:

```text
Chat model:        Local Qwen
Embeddings:        Local embedding model
Audio:             Local TTS
OCR:               Local OCR
```

and run almost everything privately.

---

# 34. Local-First Data Architecture

This is fundamental.

```text
                   APPLICATION
                        │
                  Data Repository
                        │
               ┌────────┴─────────┐
               │                  │
            Local              Remote
               │                  │
         IndexedDB/OPFS       Cloud Sync
               │                  │
               └────────┬─────────┘
                        │
                  Sync Engine
```

The app should work perfectly with the left side only.

---

# 35. Authentication

Auth0 should be optional.

```text
Anonymous
   │
   ├── Read
   ├── Speed read
   ├── Import
   ├── Highlights
   ├── Notes
   ├── Themes
   └── Local library

Login
   │
   ├── Sync
   ├── Cloud backup
   ├── Multi-device
   ├── Cloud AI
   └── Shared features
```

Auth0's current React SDK supports SPA authentication and authenticated API calls, including Authorization Code + PKCE flows, so it fits the web application's optional-account model. ([Auth0][6])

---

# 36. Cloud Architecture

Your Vercel choice makes sense, with one correction:

**Vercel Postgres itself is no longer a product.**

Vercel now connects applications to external Postgres providers through its Marketplace, including providers such as Neon, Supabase and others. ([Vercel][7])

So I would use:

```text
                    VERCEL

                     Web
                      │
              Next.js / React
                      │
          ┌───────────┼────────────┐
          │           │            │
       Functions     DB         Blob
          │        Postgres        │
          │           │            │
          └───────────┼────────────┘
                      │
                    AI
```

For files, Vercel Blob is specifically designed for large files such as videos and other user content, and supports private stores for sensitive documents. ([Vercel][8])

---

# 37. Recommended Cloud Stack

My initial stack would therefore be:

```text
Frontend
────────
React
TypeScript
Vite
PWA

Extension
─────────
Chrome Manifest V3
React
TypeScript
Vite

Monorepo
────────
pnpm
Turborepo

Database
────────
Postgres
Neon via Vercel Marketplace

Files
─────
Vercel Blob

Auth
────
Auth0

AI
──
Vercel AI SDK
Provider abstraction

Search
─────
Postgres full-text
+
pgvector initially

Deployment
──────────
Vercel
```

But every infrastructure dependency should have an abstraction layer.

---

# 38. The Monorepo

This is the architecture I'd build toward.

```text
locked-in/
│
├── apps/
│   │
│   ├── web/
│   │   └── PWA
│   │
│   ├── extension/
│   │   └── Chrome MV3
│   │
│   └── docs/
│       └── documentation
│
├── packages/
│   │
│   ├── core/
│   │   └── fundamental domain logic
│   │
│   ├── reader-engine/
│   │   └── RSVP / ORP / pacing
│   │
│   ├── document-engine/
│   │   └── canonical document model
│   │
│   ├── extraction/
│   │   └── web extraction
│   │
│   ├── epub/
│   │
│   ├── pdf/
│   │
│   ├── audio-engine/
│   │
│   ├── annotation/
│   │
│   ├── library/
│   │
│   ├── search/
│   │
│   ├── ai/
│   │
│   ├── storage/
│   │
│   ├── sync/
│   │
│   ├── themes/
│   │
│   ├── ui/
│   │
│   └── types/
│
├── services/
│   │
│   ├── ingestion/
│   ├── metadata/
│   ├── embeddings/
│   └── ai/
│
├── tooling/
│
├── scripts/
│
├── tests/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

# 39. The Most Important Package

`reader-engine` should have **zero React dependency**.

Something conceptually like:

```text
@locked-in/reader-engine

Input:
CanonicalDocument

Output:
ReadingStream

Controls:
play()
pause()
seek()
setSpeed()
next()
previous()

Modes:
normal
rsvp
orp
chunk
guided
```

The PWA and extension simply render the engine.

This means:

```text
PWA ────────────┐
                │
Chrome ─────────┼──→ Reader Engine
                │
Future iOS ─────┤
                │
Future Android ─┤
                │
Future Desktop ─┘
```

That is the architecture I would protect most carefully.

---

# 40. Canonical Document Model

At the center:

```ts
Document {
  id
  source
  metadata
  structure
  blocks
  assets
  annotations
  progress
  timestamps
}
```

Blocks:

```text
Heading
Paragraph
Quote
List
Code
Image
Table
Divider
Footnote
```

Everything else operates on this model.

---

# 41. Progress Model

Progress shouldn't simply be:

```text
percentage = 47
```

It should be tied to stable document locations.

Something like:

```text
Document
 ├── block 23
 │     └── character 182
 │
 └── normalized offset
```

Then:

```text
Normal Reader
Speed Reader
Audio
```

can all understand where the user is.

---

# 42. Annotation Model

Similarly:

```text
Annotation
├── documentId
├── blockId
├── startOffset
├── endOffset
├── type
├── color
├── note
└── createdAt
```

So a highlight is fundamentally a location in the canonical document.

Not a visual position on a webpage.

---

# 43. Sync Engine

The sync engine should eventually be capable of:

```text
Device A
   │
   ▼
Local changes
   │
   ▼
Change log
   │
   ▼
Cloud
   │
   ▼
Device B
```

Potential conflicts:

```text
Device A:
highlight changed

Device B:
same highlight changed
```

Need deterministic conflict resolution.

We should design for this early even if v1 doesn't have multi-device sync.

---

# 44. Offline Mode

The PWA should work offline after installation.

The extension should work offline for local documents.

The reader should never require a network connection to:

* open a book
* continue reading
* speed-read
* change themes
* access local highlights

Network is required only for things such as:

* cloud sync
* metadata lookup
* cloud AI
* cloud audio
* remote content

---

# 45. Privacy Model

The product's privacy promise should be extremely clear.

### Default

```text
Your documents stay on your device.
```

### Cloud sync

```text
You explicitly enable it.
```

### Cloud AI

```text
Your selected content is sent to the
configured AI provider.
```

### Local AI

```text
Content stays on your machine.
```

This should be visible inside the UI.

---

# 46. Self Hosting

A long-term goal:

```bash
git clone locked-in
docker compose up
```

Result:

```text
Locked In
├── Web
├── API
├── Postgres
├── Storage
├── Search
└── AI
```

The hosted version can run on Vercel.

The community can run it elsewhere.

This is what makes the open-source claim meaningful.

---

# 47. Extensibility

Eventually developers should be able to build:

```text
Locked In plugins

├── Importers
├── Exporters
├── Themes
├── AI providers
├── Metadata providers
├── TTS providers
├── Extractors
└── Reading modes
```

Imagine someone builds:

```text
@community/academic-paper-importer
```

or:

```text
@community/llama-audio
```

without modifying the core.

---

# 48. Import / Export

You should never trap user data inside Locked In.

Support eventually:

```text
Import
──────
EPUB
PDF
Markdown
TXT
HTML
OPML
Readwise
Pocket
Instapaper
CSV
JSON

Export
──────
Markdown
JSON
HTML
EPUB
PDF
CSV
```

Especially important:

> **Your highlights and notes must be exportable.**

---

# 49. The "Notion" Direction

Your Notion comparison is useful, but I wouldn't copy Notion's product.

Instead:

> **Notion for reading rather than Notion for documents.**

Eventually the user might create:

```text
Research Project: AI Agents

├── Reading List
├── Papers
├── Highlights
├── Notes
├── Questions
├── Sources
└── AI Summary
```

But the primitive remains **reading**.

Not arbitrary blocks.

---

# 50. Knowledge Graph

Eventually:

```text
                 RAG
                /   \
               /     \
          Vector DB   Retrieval
             │          │
             │          │
           Embeddings ───┘
               │
               │
             Agents
            /      \
       Memory      Tools
```

Locked In could detect that these concepts repeatedly occur together in your reading.

Eventually:

```text
AI Agents
   │
   ├── Memory
   │    ├── Episodic
   │    └── Semantic
   │
   ├── RAG
   │
   └── Tool Use
```

The graph doesn't need to exist in MVP.

But the data model should make it possible.

---

# 51. The Reading Coach

Long-term, Locked In could understand:

```text
Your reading profile
────────────────────

Average speed       438 WPM
Technical           361 WPM
Articles            502 WPM
Books               384 WPM

Comprehension       89%

Preferred mode      ORP
Preferred font      ...
```

Then recommend:

```text
Your current session is significantly
more difficult than your average.

Suggested:
380 WPM
Guided mode
+ 20% punctuation pause
```

Again, **recommendation rather than automation**.

---

# 52. Comprehension

The product shouldn't create a toxic:

> "READ FASTER = BETTER"

culture.

Instead:

```text
Reading performance

Speed
   ×
Comprehension
   ×
Retention
```

After a chapter:

```text
You read:
4,200 words

Speed:
470 WPM

Estimated comprehension:
91%

Time:
9m 02s
```

AI can optionally generate questions.

---

# 53. Reading Sessions

Every session can be represented as:

```text
ReadingSession

document
startTime
endTime
mode
initialPosition
finalPosition
WPM
wordsRead
comprehension
device
```

This enables meaningful analytics without requiring analytics tracking.

---

# 54. Analytics Philosophy

Personal analytics:

**Yes.**

Surveillance analytics:

**No.**

The user should own their reading history.

Anonymous product analytics can be optional and removable for self-hosters.

---

# 55. The Home Screen

I envision something like:

```text
┌─────────────────────────────────────────────────────┐
│ 🔒 Locked In                         Search     ☺   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Good evening.                                      │
│                                                     │
│ Continue reading                                   │
│ ──────────────────────────────────────────────────  │
│                                                     │
│ Designing Data-Intensive Applications       63%    │
│ The Future of AI                             28%    │
│ RAG Evaluation Paper                         71%    │
│                                                     │
│                                                     │
│ Quick capture                                      │
│                                                     │
│ [ Drop PDF ] [ Import EPUB ] [ Paste URL ]         │
│                                                     │
│                                                     │
│ Your library                                       │
│                                                     │
│ Inbox    Books    Articles    Papers    Highlights │
└─────────────────────────────────────────────────────┘
```

Simple.

Fast.

Not Notion-like clutter.

---

# 56. The Speed Reader UI

When actually reading:

**Everything should disappear.**

```text
                    482 WPM

                         │
                    international
                         │
                         K
                         │

                ─────────●─────────

             37%              08:24
```

Keyboard first.

Minimal controls.

No unnecessary sidebars.

The reader is the product.

---

# 57. Audio UI

```text
┌─────────────────────────────────────┐
│                                     │
│             The Future of AI       │
│                                     │
│     "Artificial intelligence..."    │
│                                     │
│       ─────────●──────────          │
│                                     │
│       14:32 / 38:12                 │
│                                     │
│       0.75×  1×  1.25×  1.5×  2×  │
│                                     │
│           ◀    ▶    ▶              │
│                                     │
└─────────────────────────────────────┘
```

With synchronized text.

---

# 58. The Extension + PWA Relationship

This is fundamental.

The extension is:

> **Capture + browser integration**

The PWA is:

> **The full reading workspace**

The shared packages are:

> **The product itself**

So:

```text
             LOCKED IN CORE
                    │
         ┌──────────┴──────────┐
         │                     │
       PWA                 Extension
         │                     │
 Full experience         Browser bridge
         │                     │
         └──────────┬──────────┘
                    │
              Shared data
```

---

# 59. What MVP Should Actually Be

Despite this enormous vision, **the first version should be surprisingly small.**

### MVP

```text
Chrome Extension
       +
PWA
       +
Local-first library
       +
Web extraction
       +
PDF
       +
EPUB
       +
Normal reader
       +
RSVP
       +
ORP
       +
Customization
       +
Progress
       +
Highlights
       +
Notes
       +
Optional Auth0
       +
Basic sync
```

That's enough.

Do **not** put:

* knowledge graph
* autonomous AI
* local LLM
* generated audiobooks
* complex collaboration
* plugins

into the first release.

Build the foundations for them.

---

# 60. Phase 2

Then:

```text
AI
├── document summary
├── explain
├── ask document
├── semantic search
└── hybrid search

Audio
├── TTS
├── synced narration
└── background playback

Library
├── collections
├── tags
└── advanced filtering
```

---

# 61. Phase 3

Then:

```text
AI knowledge base

Ask my library
Related concepts
Related highlights
Automatic tagging
Automatic summaries
Cross-document comparison
```

---

# 62. Phase 4

Then:

```text
Local AI

Ollama
llama.cpp
WebGPU
Local embeddings
Local LLM
Local TTS
Local OCR
```

---

# 63. Phase 5

Then:

```text
Personal Reading Intelligence

Reading profile
Adaptive pacing
Comprehension analysis
AI reading coach
Knowledge graph
Personalized recommendations
```

---

# 64. Phase 6

Then:

```text
Platform

Plugins
Community themes
Community readers
Custom AI providers
Custom importers
Custom exporters
Self-hosting
Mobile
Desktop
Firefox
Safari
```

---

# 65. What Locked In Should Ultimately Feel Like

The user shouldn't think:

> "I'm using a speed reader."

or:

> "I'm using a PDF reader."

or:

> "I'm using a Readwise alternative."

They should think:

> **"This is where I read."**

That's the goal.

---

# 66. The Ultimate Workflow

Imagine this five years into the project:

You see a paper on the web.

```text
Paper
 ↓
Locked In extension
 ↓
Save
```

Later:

```text
Library
 ↓
Open paper
 ↓
Normal mode
```

You switch:

```text
Speed Read
 ↓
420 WPM
 ↓
ORP
```

You highlight:

```text
Important finding
 ↓
Highlight
 ↓
Note
```

Three weeks later you import a book.

```text
EPUB
 ↓
Metadata
 ↓
Library
```

You listen while commuting:

```text
AI audiobook
 ↓
1.5×
 ↓
word-synced
```

Two months later:

```text
Ask my library:

"What have I learned about
agent memory?"
```

Locked In searches:

```text
12 books
47 articles
8 papers
63 highlights
14 notes
```

and produces a cited synthesis.

Then you click one source.

```text
→ Jump to highlight
→ Open original paragraph
→ Play corresponding audio
```

**That is the product.**

---

# 67. The One-Sentence Vision

If I had to reduce the entire product to one sentence:

> **Locked In is an open-source, local-first reading OS that turns anything you read into a searchable personal knowledge base, letting you consume the same information through traditional reading, speed reading, or synchronized AI-generated audio.**

---

# 68. The Product Architecture in One Diagram

```text
                              LOCKED IN
                                  │
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                  CAPTURE                   IMPORT
                     │                         │
              Chrome Extension          PDF / EPUB / DOCX
              Web Extraction            Markdown / TXT
              URLs                      RSS / Other
                     │                         │
                     └────────────┬────────────┘
                                  │
                                  ▼
                         DOCUMENT ENGINE
                                  │
                         Canonical Document
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
          NORMAL               SPEED                 AUDIO
          READER              READER              ENGINE
             │                    │                    │
        Typography              RSVP                 TTS
        Pagination              ORP                  AI Voice
        Themes                  Chunk                Local AI
        Layout                  Guided               Sync
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
                             ANNOTATIONS
                                  │
                         ┌────────┴────────┐
                         │                 │
                    Highlights           Notes
                         │                 │
                         └────────┬────────┘
                                  │
                                  ▼
                           PERSONAL LIBRARY
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                 Search      Collections       Tags
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                                  ▼
                           KNOWLEDGE LAYER
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
          Full Text           Embeddings             AI
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  │
                                  ▼
                           ASK YOUR LIBRARY
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
              Explain          Compare          Connect
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
                                  ▼
                         PERSONAL KNOWLEDGE
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                Analytics      Coach         Knowledge
                                              Graph
```

---

# 69. And underneath everything

```text
                        LOCKED IN
                            │
                    ┌───────┴────────┐
                    │                │
                LOCAL-FIRST        CLOUD
                    │                │
              IndexedDB/OPFS       Vercel
                    │                │
                    │       ┌────────┼─────────┐
                    │       │        │         │
                    │    Postgres   Blob       AI
                    │       │        │         │
                    └───────┴────────┴─────────┘
                            │
                         SYNC
                            │
                         AUTH0
```

And the whole thing sits inside a **monorepo**, where the actual intellectual property of the project is the shared domain/core packages, not the PWA or extension UI.

---

# 70. The Strategic Positioning

I would define the competitive landscape like this:

| Product category         | What it gives users                                             |
| ------------------------ | --------------------------------------------------------------- |
| Traditional ebook reader | Books                                                           |
| SwiftRead                | Speed reading                                                   |
| Readwise Reader          | Universal reading + knowledge management                        |
| Notion                   | General knowledge workspace                                     |
| Audiobook apps           | Listening                                                       |
| AI assistants            | Question answering                                              |
| **Locked In**            | **Reading + speed + audio + knowledge + AI in one open system** |

The goal isn't to beat every competitor at every individual feature.

The goal is to create a **coherent system where those capabilities reinforce one another**.

SwiftRead already demonstrates the viability of browser-based speed reading and synced narration. Readwise demonstrates the value of consolidating many content types into a customizable reading library. Open-source projects demonstrate that local-first reading and speed-reading engines can work without accounts or tracking. ([Chrome Web Store][1])

**Locked In's opportunity is to unify those ideas under an open architecture.**

---

# Final Product North Star

I would put this directly into the future repository's `VISION.md`:

> ## Locked In
>
> **Read faster. Listen anywhere. Remember everything. Own your knowledge.**
>
> Locked In is an open-source, local-first reading system designed for people who consume large amounts of information.
>
> It brings webpages, articles, books, PDFs, research papers and other documents into one customizable reading environment. Users can read normally, speed-read using RSVP/ORP and other focus modes, or listen through synchronized TTS and eventually locally generated AI audiobooks.
>
> Every document, highlight, note and reading session contributes to a personal knowledge base that can be searched using both traditional and semantic search. AI can explain, summarize, compare and connect information across the user's own library.
>
> Locked In works without an account, keeps data local by default, supports optional cloud synchronization, and is designed from the beginning to support local AI, self-hosting, community extensions and alternative infrastructure.
>
> The Chrome extension is the capture and browser integration layer. The PWA is the full reading workspace. A shared, framework-independent core powers both.
>
> The long-term goal is not to build another speed reader or another read-it-later application.
>
> **The goal is to build an open reading OS: a place where everything you read can be consumed, understood, connected and remembered.**

And I think **that should be the north star for the repository**. The MVP can be tiny, but every architectural decision should avoid boxing us out of this vision.

[1]: https://chromewebstore.google.com/detail/swiftread-read-faster-lea/ipikiaejjblmdopojhpejjmbedhlibno?utm_source=chatgpt.com "SwiftRead - read faster, learn more - Chrome Web Store"
[2]: https://github.com/sami-29/speeedy?utm_source=chatgpt.com "GitHub - sami-29/speeedy: Free, open-source, local-first RSVP speed reader for PDFs & EPUBs. Fixed focal point to reduce eye strain, OpenDyslexic + Irlen support, built-in stats and benchmark. No accounts, no tracking, fully offline. · GitHub"
[3]: https://github.com/GoogleChrome/developer.chrome.com/blob/main/site/en/docs/extensions/mv3/architecture-overview/index.md?utm_source=chatgpt.com "developer.chrome.com/site/en/docs/extensions/mv3/architecture-overview/index.md at main · GoogleChrome/developer.chrome.com · GitHub"
[4]: https://docs.readwise.io/reader/docs?utm_source=chatgpt.com "What is Readwise Reader? - Readwise Docs"
[5]: https://vercel.com/docs/ai-gateway/sdks-and-apis?utm_source=chatgpt.com "SDKs & APIs"
[6]: https://auth0.com/docs/quickstart/spa/react?utm_source=chatgpt.com "Add Login to Your React Application - Auth0 Docs"
[7]: https://vercel.com/docs/postgres?utm_source=chatgpt.com "Postgres on Vercel"
[8]: https://vercel.com/docs/vercel-blob?utm_source=chatgpt.com "Vercel Blob"
