import { useState } from 'react';
import { Link } from 'react-router-dom';
import { askLibrary, DisabledAIProvider, OllamaProvider, SpaceXAIProvider } from '@locked-in/ai';
import { LibrarySearch } from '@locked-in/search';
import type { AIAnswer } from '@locked-in/types';
import { useLibrary } from '../lib/library-state.js';

export function AskPage() {
  const { documents, settings } = useLibrary();
  const [question, setQuestion] = useState('What did I keep about attention?');
  const [answer, setAnswer] = useState<AIAnswer | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask() {
    setError(undefined);
    setBusy(true);
    const search = new LibrarySearch();
    const provider =
      settings.aiProvider === 'spacexai' && key
        ? new SpaceXAIProvider({ apiKey: key, model: settings.aiModel })
        : settings.aiProvider === 'ollama'
          ? new OllamaProvider(settings.aiBaseUrl)
          : new DisabledAIProvider();
    try {
      setAnswer(await askLibrary(provider, search, documents, question, 'library'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The model did not answer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <h1 className="font-serif text-4xl tracking-tight">Ask</h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        Answers use documents already on this device. Without a provider, you still get a local excerpt.
      </p>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-8 min-h-28 w-full border border-border bg-transparent p-3 text-sm outline-none"
      />
      {settings.aiProvider === 'spacexai' ? (
        <input
          type="password"
          placeholder="XAI API key — stays in memory"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          className="mt-3 h-10 w-full border border-border bg-transparent px-3 text-sm outline-none"
        />
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void ask()}
        className="mt-4 h-10 w-fit border border-border px-4 font-mono text-[10px] uppercase tracking-[0.18em]"
      >
        {busy ? 'Asking…' : 'Ask'}
      </button>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {answer ? (
        <article className="mt-10 border-t border-border pt-8">
          <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed">{answer.text}</p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {answer.provider}
            {answer.grounded ? ' · grounded' : ''}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {answer.citations.map((citation) => (
              <li key={citation.documentId}>
                <Link className="underline decoration-accent/60 underline-offset-4" to={`/read/${citation.documentId}`}>
                  {citation.title}
                </Link>
                <span className="text-muted-foreground"> — {citation.excerpt}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
