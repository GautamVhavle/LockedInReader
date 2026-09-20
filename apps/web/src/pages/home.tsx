import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DocumentCard, EmptyState } from '@locked-in/ui';
import { classifyDocument, filterLibrary } from '@locked-in/library';
import { useLibrary } from '../lib/library-state.js';
import { ingestFiles } from '../lib/platform.js';

export function HomePage() {
  const { documents, progress, ready, error, refresh } = useLibrary();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const continuing = filterLibrary(documents, progress, 'continue');
  const next = continuing[0] ?? documents[0];
  const rest = documents.filter((document) => document.id !== next?.id);

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
    <label className="mt-2 inline-flex cursor-pointer border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]">
      Choose files
      <input
        type="file"
        className="hidden"
        multiple
        accept=".md,.txt,.html,.epub,.pdf,text/plain,text/markdown,text/html,application/epub+zip,application/pdf"
        onChange={(event) => void onFiles(event.target.files)}
      />
    </label>
  );

  return (
    <div
      className={`mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10 ${dragging ? 'outline outline-1 outline-accent' : ''}`}
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
      <header className="mb-12 flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Locked In</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight">Desk</h1>
        </div>
        <p className="hidden max-w-[16rem] text-right text-xs text-muted-foreground sm:block">
          Drop a file anywhere. Cmd+K to jump.
        </p>
      </header>

      {!ready ? (
        <p className="text-sm text-muted-foreground">Opening the shelf…</p>
      ) : error ? (
        <EmptyState title="The shelf did not open" body={error} action={picker} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="Drop a document on the desk"
          body="Markdown, TXT, HTML, EPUB, or PDF. It stays on this machine."
          action={picker}
        />
      ) : (
        <>
          {next ? (
            <section className="mb-12">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {continuing[0] ? 'Continue' : 'Start'}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/read/${next.id}`)}
                className="w-full border border-border px-5 py-6 text-left hover:border-accent"
              >
                <p className="font-serif text-3xl leading-tight tracking-tight">{next.metadata.title}</p>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  {next.blocks.find((block) => block.type === 'paragraph' && block.text)?.text}
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Open page</p>
              </button>
            </section>
          ) : null}
          {rest.length > 0 ? (
            <section>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shelf</p>
              {rest.map((document) => (
                <DocumentCard
                  key={document.id}
                  title={document.metadata.title}
                  kind={classifyDocument(document)}
                  excerpt={document.blocks.find((block) => block.text)?.text ?? ''}
                  progress={progress.find((item) => item.documentId === document.id)?.percent}
                  words={document.metadata.wordCount}
                  onClick={() => navigate(`/read/${document.id}`)}
                />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
