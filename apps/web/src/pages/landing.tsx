import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orpIndex, stageParts, type ReaderToken } from '@locked-in/reader-engine';
import { Button } from '@locked-in/ui';

const sentence = 'A margin is the part of the page that refuses to become content.';
const words = sentence.split(/\s+/);

const modes = [
  { id: 'orp', label: 'Focus', hint: 'One word. The copper letter stays still, so your eye does not hunt.' },
  { id: 'rsvp', label: 'Flash', hint: 'One word, with no anchor.' },
  { id: 'chunk', label: 'Phrase', hint: 'A few words at a time, still on the anchor.' },
  { id: 'guided', label: 'Guide', hint: 'The sentence stays. The word walks.' },
] as const;

type ModeId = (typeof modes)[number]['id'];

const keeps = [
  { term: 'Place', detail: 'The passage you stopped on. The desk opens there next time.' },
  { term: 'Marks', detail: 'A sentence you chose to keep, with a note if you want one.' },
  { term: 'Voice', detail: 'Play from the passage in front of you. Change the speaker, the pace, and the tone.' },
  { term: 'Shelf', detail: 'Books, articles, and pages you have not started.' },
];

function token(text: string, wordIndex: number): ReaderToken {
  return {
    text,
    orpIndex: orpIndex(text),
    blockId: 'demo',
    blockType: 'paragraph',
    blockOffset: 0,
    wordIndex,
    sentenceIndex: 0,
    kind: 'word',
    isParagraphStart: wordIndex === 0,
    isSentenceEnd: /[.!?…]$/.test(text),
    isRtl: false,
  };
}

function frame(mode: ModeId, index: number): ReaderToken[] {
  if (mode === 'chunk') {
    const size = 3;
    const start = Math.max(0, Math.min(index - 1, words.length - size));
    return words.slice(start, start + size).map((word, offset) => token(word, start + offset));
  }
  const word = words[index];
  return word ? [token(word, index)] : [];
}

export function LandingPage() {
  const [mode, setMode] = useState<ModeId>('orp');
  const [index, setIndex] = useState(9);
  const [held, setHeld] = useState(false);
  const [reduced, setReduced] = useState(false);
  const hint = modes.find((item) => item.id === mode)?.hint;
  const shown = frame(mode, index);
  const active = new Set(shown.map((item) => item.wordIndex));
  const parts = stageParts(shown);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduced || held) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((value) => (value + 1) % words.length);
    }, 720);
    return () => window.clearInterval(id);
  }, [held, reduced]);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
        <Link to="/" className="font-serif text-lg tracking-tight">
          Locked In
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <Link
            to="/library"
            className="hidden h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground sm:flex"
          >
            Library
          </Link>
          <Button asChild className="h-11 px-4">
            <Link to="/desk">Open the desk</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Local to this browser
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.7rem,7vw,4.6rem)] leading-[1.02] tracking-tight">
            Read faster.
            <span className="mt-1 block">Stay with the sentence.</span>
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-muted-foreground">
            Bring in a book, an article, or a PDF. Read it as a page, flash the words, or listen
            from the line you are on. The file stays here. There is no account.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-11 px-6">
              <Link to="/desk">Open the desk</Link>
            </Button>
          </div>
        </section>

        <section className="scroll-mt-16 border-t border-border" aria-labelledby="ways-title">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 id="ways-title" className="font-serif text-3xl tracking-tight">
              Four ways through the same sentence
            </h2>
            <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
              Focus holds one word and marks the letter your eye should land on. Flash drops that
              anchor. Phrase shows a few words. Guide keeps the sentence and walks the word. You
              switch when the page asks for it.
            </p>

            <div className="mt-12">
              <p className="sr-only" aria-live={held || reduced ? 'polite' : 'off'}>
                {shown.map((item) => item.text).join(' ')}
              </p>
              {mode === 'guided' ? (
                <p className="guide-line" aria-hidden="true">
                  {words.map((word, wordIndex) => (
                    <span key={wordIndex} className={wordIndex === index ? 'guide-now' : undefined}>
                      {word}{' '}
                    </span>
                  ))}
                </p>
              ) : (
                <>
                  <div
                    className="stage"
                    data-mark={mode === 'rsvp' ? 'false' : 'true'}
                    style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}
                    dir="auto"
                    aria-hidden="true"
                  >
                    <span className="stage-side stage-before">{parts?.before}</span>
                    <span className="stage-pivot">{parts?.pivot}</span>
                    <span className="stage-side stage-after">{parts?.after}</span>
                  </div>
                  <p className="context-line" aria-hidden="true">
                    {words.map((word, wordIndex) => (
                      <span key={wordIndex} className={active.has(wordIndex) ? 'guide-now' : undefined}>
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                </>
              )}
            </div>

            <div className="mt-10 grid grid-cols-4" role="toolbar" aria-label="Reading mode">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`h-11 border-b-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    mode === item.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center font-serif text-muted-foreground">{hint}</p>
            <div className="mt-3 text-center">
              <button
                type="button"
                className="h-11 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                aria-pressed={held || reduced}
                disabled={reduced}
                onClick={() => setHeld((value) => !value)}
              >
                {reduced ? 'Motion off' : held ? 'Run' : 'Hold'}
              </button>
            </div>
            <p className="mt-8 font-serif text-muted-foreground">
              That line is from The Quiet Margin, a short book already on the shelf.
            </p>
          </div>
        </section>

        <section className="scroll-mt-16 border-t border-border" aria-labelledby="session-title">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 id="session-title" className="font-serif text-3xl tracking-tight">
              A session
            </h2>
            <ol className="mt-8">
              <li className="border-t border-border py-6">
                <h3 className="font-serif text-2xl">Bring it in</h3>
                <p className="mt-2 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
                  Markdown, text, HTML, EPUB, or PDF. The shelf also starts with a few pages, so
                  you can read before you import anything.
                </p>
              </li>
              <li className="border-t border-border py-6">
                <h3 className="font-serif text-2xl">Read it</h3>
                <p className="mt-2 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
                  The page is the default. The bar at the bottom plays the passage, skips ahead,
                  and opens Focus, Flash, Phrase, or Guide.
                </p>
              </li>
              <li className="border-t border-border py-6">
                <h3 className="font-serif text-2xl">Leave it</h3>
                <p className="mt-2 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
                  The place, the marks, and the notes stay on this device. Tomorrow the desk opens
                  on the passage you left.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="scroll-mt-16 border-t border-border" aria-labelledby="keeps-title">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 id="keeps-title" className="font-serif text-3xl tracking-tight">
              What stays
            </h2>
            <dl className="mt-8">
              {keeps.map((item) => (
                <div key={item.term} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-border py-4">
                  <dt className="pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {item.term}
                  </dt>
                  <dd className="font-serif text-lg leading-relaxed">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 border-t border-border pt-10">
              <p className="font-serif text-2xl leading-snug">The desk is the place you come back to.</p>
              <div className="mt-6">
                <Button asChild size="lg" className="h-11 px-6">
                  <Link to="/desk">Open the desk</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
