import { Link } from 'react-router-dom';
import { useLibrary } from '../lib/library-state.js';

export function NotesPage() {
  const { highlights, notes, documents } = useLibrary();
  const title = (id?: string) => documents.find((doc) => doc.id === id)?.metadata.title ?? 'Untitled';

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Marks</h1>
      <section className="mt-10">
        {highlights.length === 0 && notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select a sentence on a page and choose Mark.</p>
        ) : null}
        {highlights.map((highlight) => (
          <Link
            key={highlight.id}
            to={`/read/${highlight.documentId}`}
            className="block border-b border-border py-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {title(highlight.documentId)}
            </p>
            <p className="mt-2 font-serif text-2xl leading-snug">{highlight.text}</p>
          </Link>
        ))}
        {notes.map((note) => (
          <article key={note.id} className="border-b border-border py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Note</p>
            <p className="mt-2 text-sm leading-relaxed">{note.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
