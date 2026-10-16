import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { classifyDocument, filterLibrary } from '@locked-in/library';
import type { CanonicalDocument, ReadingProgress } from '@locked-in/types';
import { Button, DocumentCard, EmptyState, Skeleton } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { ingestFiles } from '../lib/platform.js';

const accept =
  '.md,.txt,.html,.epub,.pdf,text/plain,text/markdown,text/html,application/epub+zip,application/pdf';

function previewOf(document: CanonicalDocument): string {
  return (
    document.blocks.find((block) => block.type === 'paragraph' && block.text)?.text ??
    document.blocks.find((block) => block.text)?.text ??
    ''
  );
}

function placeOf(document: CanonicalDocument, progress: ReadingProgress[], wpm: number) {
  const saved = progress.find((item) => item.documentId === document.id);
  const percent = saved ? Math.round(Math.min(100, Math.max(0, saved.percent))) : undefined;
  const remaining = Math.round(document.metadata.wordCount * (1 - (percent ?? 0) / 100));
  const minutes = Math.max(1, Math.round(remaining / Math.max(80, wpm)));
  return { percent, minutes, words: document.metadata.wordCount };
}

export function HomePage() {
  const { documents, progress, settings, ready, error, refresh } = useLibrary();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const continuing = filterLibrary(documents, progress, 'continue');
  const hero = continuing[0] ?? documents[0];
  const alsoOpen = continuing.slice(1);
  const held = new Set([hero?.id, ...alsoOpen.map((document) => document.id)].filter(Boolean));
  const shelves = [
    {
      label: 'Books',
      empty: 'An EPUB lands here.',
      documents: filterLibrary(documents, progress, 'books').filter((document) => !held.has(document.id)),
    },
    {
      label: 'Articles',
      empty: 'A saved page lands here.',
      documents: filterLibrary(documents, progress, 'articles').filter(
        (document) => !held.has(document.id),
      ),
    },
    {
      label: 'To start',
      empty: 'Files you have not opened.',
      documents: filterLibrary(documents, progress, 'inbox').filter((document) => !held.has(document.id)),
    },
  ];
  const papers = filterLibrary(documents, progress, 'papers').filter((document) => !held.has(document.id));
  if (papers.length > 0) {
    shelves.push({ label: 'Papers', empty: '', documents: papers });
  }

  async function onFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    try {
      const last = await ingestFiles(files);
      await refresh();
      toast.success('Ready to read');
      if (last) navigate(`/read/${last.id}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Import failed');
    }
  }

  const picker = (
    <Button asChild variant="outline" className="min-h-11">
      <label className="cursor-pointer">
        Choose a file
        <input
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={(event) => void onFiles(event.target.files)}
        />
      </label>
    </Button>
  );

  return (
    <div
      className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void onFiles([...event.dataTransfer.files]);
      }}
    >
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Desk
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Where you left off</h1>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Continue the open page, pick up something on the shelf, or bring a file in.
        </p>
      </header>

      {!ready ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <EmptyState title="The shelf did not open" body={error} action={picker} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="The desk is clear"
          body="Drop a Markdown, TXT, HTML, EPUB, or PDF file. It stays on this machine."
          action={picker}
        />
      ) : (
        <div className="flex flex-col gap-12">
          {hero ? <Continue document={hero} progress={progress} wpm={settings.wpm} started={Boolean(continuing[0])} /> : null}
          {alsoOpen.length > 0 ? (
            <section aria-labelledby="also-open">
              <h2 id="also-open" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Also open
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {alsoOpen.map((document) => (
                  <DocumentCard
                    key={document.id}
                    title={document.metadata.title}
                    kind={classifyDocument(document)}
                    excerpt={previewOf(document)}
                    progress={progress.find((item) => item.documentId === document.id)?.percent}
                    words={document.metadata.wordCount}
                    onClick={() => navigate(`/read/${document.id}`)}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <section aria-labelledby="shelf-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 id="shelf-heading" className="font-serif text-2xl tracking-tight">
                On the shelf
              </h2>
              <Link
                to="/library"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
              >
                Whole library
              </Link>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {shelves.map((shelf) => (
                <div key={shelf.label} className="flex flex-col gap-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {shelf.label}
                  </h3>
                  {shelf.documents.length === 0 ? (
                    <p className="border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      {shelf.empty}
                    </p>
                  ) : (
                    shelf.documents.map((document) => (
                      <DocumentCard
                        key={document.id}
                        title={document.metadata.title}
                        kind={classifyDocument(document)}
                        showKind={false}
                        excerpt={previewOf(document)}
                        progress={progress.find((item) => item.documentId === document.id)?.percent}
                        words={document.metadata.wordCount}
                        onClick={() => navigate(`/read/${document.id}`)}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
            {papers.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                A PDF shows up under Papers after you import one.
              </p>
            ) : null}
          </section>
        </div>
      )}

      <section
        aria-labelledby="bring-in"
        className={`mt-12 border border-dashed px-5 py-6 ${dragging ? 'border-primary bg-muted/40' : 'border-border'}`}
      >
        <h2 id="bring-in" className="font-serif text-2xl tracking-tight">
          Bring a page in
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Drop a file anywhere on the desk. Markdown, TXT, HTML, EPUB, or PDF. It stays in this browser.
        </p>
        <div className="mt-4">{picker}</div>
      </section>
    </div>
  );
}

function Continue({
  document,
  progress,
  wpm,
  started,
}: {
  document: CanonicalDocument;
  progress: ReadingProgress[];
  wpm: number;
  started: boolean;
}) {
  const place = placeOf(document, progress, wpm);
  return (
    <section aria-labelledby="continue-heading">
      <h2 id="continue-heading" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {started ? 'Continue' : 'Start here'}
      </h2>
      <article className="mt-4 border border-border border-l-4 border-l-primary bg-card px-5 py-6 sm:px-8 sm:py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {classifyDocument(document)}
        </p>
        <h3 className="mt-3 max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          <Link to={`/read/${document.id}`} className="hover:text-accent">
            {document.metadata.title || 'Untitled'}
          </Link>
        </h3>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {previewOf(document) || 'No preview yet'}
        </p>
        <p className="mt-4 font-mono text-[11px] tabular-nums text-muted-foreground">
          {place.percent !== undefined
            ? `${place.percent}% · about ${place.minutes} min left`
            : `${place.words.toLocaleString()} words · not started`}
        </p>
        <div className="filament mt-3 h-0.5 max-w-md">
          <span style={{ width: `${place.percent ?? 0}%` }} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link to={`/read/${document.id}`}>Read the page</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to={`/speed/${document.id}`}>Read faster</Link>
          </Button>
        </div>
      </article>
    </section>
  );
}
