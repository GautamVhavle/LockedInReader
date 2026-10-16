import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { progressPercent } from '@locked-in/core';
import { saveProgress } from '@locked-in/library';
import {
  clampWpm,
  ReaderEngine,
  remainingLabel,
  stageParts,
  WPM_MAX,
  WPM_MIN,
  type ReaderToken,
} from '@locked-in/reader-engine';
import type { ReadingMode } from '@locked-in/types';
import {
  Badge,
  Button,
  EmptyState,
  Label,
  Progress,
  Skeleton,
  Slider,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { workspace } from '../lib/platform.js';

const modes: Array<{ id: ReadingMode; label: string; hint: string }> = [
  { id: 'orp', label: 'Focus', hint: 'One word. The copper letter stays still.' },
  { id: 'rsvp', label: 'Flash', hint: 'One word, no anchor.' },
  { id: 'chunk', label: 'Phrase', hint: 'A few words at a time, still on the anchor.' },
  { id: 'guided', label: 'Guide', hint: 'The sentence stays. The word walks.' },
];

const phraseSizes = [1, 2, 3, 4, 5, 6];

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const controlClass = 'min-h-11 font-mono text-[11px] uppercase tracking-[0.14em]';

function Stage({ tokens, mark }: { tokens: ReaderToken[]; mark: boolean }) {
  const parts = stageParts(tokens);
  if (!parts) return null;
  return (
    <div
      className="stage"
      data-mark={mark ? 'true' : 'false'}
      dir="auto"
      aria-hidden="true"
      title={tokens.map((token) => token.text).join(' ')}
    >
      <span className="stage-side stage-before">{parts.before}</span>
      <span className="stage-pivot">{parts.pivot}</span>
      <span className="stage-side stage-after">{parts.after}</span>
    </div>
  );
}

function Sentence({
  tokens,
  active,
  large,
}: {
  tokens: ReaderToken[];
  active: Set<number>;
  large?: boolean;
}) {
  if (tokens.length === 0) return null;
  return (
    <p className={large ? 'guide-line' : 'context-line'} dir="auto">
      {tokens.map((token) => (
        <span
          key={token.wordIndex}
          className={active.has(token.wordIndex) ? 'guide-now' : undefined}
        >
          {token.text}{' '}
        </span>
      ))}
    </p>
  );
}

export function SpeedPage() {
  const { id } = useParams();
  const { documents, settings, progress, ready, refresh } = useLibrary();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const requested = search.get('mode');
  const engine = useMemo(() => new ReaderEngine(), []);
  const loadedId = useRef<string | undefined>(undefined);
  const [frame, setFrame] = useState(engine.currentFrame());
  const [mode, setMode] = useState<ReadingMode>('orp');
  const [wpm, setWpm] = useState(() => clampWpm(settings.wpm));
  const [chunk, setChunk] = useState(settings.chunkSize);
  const [showSentence, setShowSentence] = useState(true);
  const [booted, setBooted] = useState(false);
  const document = documents.find((item) => item.id === id);
  const modeRef = useRef(mode);
  const docRef = useRef(document);
  modeRef.current = mode;
  docRef.current = document;

  useEffect(() => engine.onFrame(setFrame), [engine]);

  useEffect(() => {
    if (!ready || !document || loadedId.current === document.id) return;
    engine.load(document);
    const saved = progress.find((item) => item.documentId === document.id);
    if (saved?.position.wordIndex !== undefined) engine.seek(saved.position.wordIndex);
    const savedMode = saved?.lastMode;
    const fromQuery =
      requested === 'orp' || requested === 'rsvp' || requested === 'chunk' || requested === 'guided'
        ? requested
        : undefined;
    if (fromQuery) setMode(fromQuery);
    else if (savedMode && savedMode !== 'normal') setMode(savedMode);
    setWpm(clampWpm(settings.wpm));
    setChunk(settings.chunkSize);
    loadedId.current = document.id;
    setFrame(engine.currentFrame());
    setBooted(true);
  }, [document, engine, progress, ready, requested, settings.chunkSize, settings.wpm]);

  useEffect(() => {
    if (!id || loadedId.current !== id) return;
    if (
      requested === 'orp' ||
      requested === 'rsvp' ||
      requested === 'chunk' ||
      requested === 'guided'
    ) {
      setMode(requested);
    }
  }, [id, requested]);

  useEffect(() => {
    engine.setMode(mode);
    engine.setSpeed(wpm);
    engine.setChunkSize(chunk);
  }, [chunk, engine, mode, wpm]);

  useEffect(() => {
    return () => {
      engine.pause();
      const current = docRef.current;
      const position = engine.position();
      if (!current || !position) return;
      void saveProgress(
        workspace,
        current.id,
        position,
        progressPercent(current, position),
        modeRef.current,
      ).then(() => refresh());
    };
  }, [engine, refresh]);

  useEffect(() => {
    function onHide() {
      if (!window.document.hidden || !engine.getState().playing) return;
      engine.pause();
      const position = engine.position();
      const current = docRef.current;
      if (!position || !current) return;
      void saveProgress(
        workspace,
        current.id,
        position,
        progressPercent(current, position),
        modeRef.current,
      ).then(() => refresh());
    }
    window.document.addEventListener('visibilitychange', onHide);
    return () => window.document.removeEventListener('visibilitychange', onHide);
  }, [engine, refresh]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="slider"], button, a, [role="tab"], [role="switch"]',
        )
      ) {
        if (event.key === 'Escape') navigate(`/read/${id}`);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        if (engine.getState().playing) {
          engine.pause();
          const position = engine.position();
          const current = docRef.current;
          if (position && current) {
            void saveProgress(
              workspace,
              current.id,
              position,
              progressPercent(current, position),
              modeRef.current,
            ).then(() => refresh());
          }
        } else engine.play();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        engine.next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        engine.previous();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        engine.jumpSentence(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        engine.jumpSentence(1);
      } else if (event.key === 'Escape') {
        navigate(`/read/${id}`);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [engine, id, navigate, refresh]);

  if (!ready || (document && !booted)) {
    return (
      <div className="reader-surface flex min-h-svh flex-col gap-8 p-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mx-auto mt-24 h-16 w-2/3 max-w-xl" />
      </div>
    );
  }
  if (!document) {
    return (
      <div className="reader-surface flex min-h-svh items-center px-6">
        <EmptyState
          title="Not on this device"
          body="That document is not in the library on this browser."
          action={
            <Button asChild className={controlClass}>
              <Link to="/desk">Desk</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const current = document;
  const state = engine.getState();
  const sentence = engine.currentSentence();
  const active = new Set(frame.tokens.map((token) => token.wordIndex));
  const mark = settings.orpEnabled && mode !== 'rsvp';
  const left = Math.max(0, state.tokenCount - frame.index);
  const place = state.tokenCount ? Math.min(frame.index, state.tokenCount - 1) : 0;
  const readPercent = state.tokenCount > 1 ? (place / (state.tokenCount - 1)) * 100 : 0;
  const sizes = phraseSizes.includes(chunk)
    ? phraseSizes
    : [...phraseSizes, chunk].sort((a, b) => a - b);
  const modeHint = modes.find((item) => item.id === mode)?.hint;
  const sentenceVisible = mode === 'guided' || showSentence;

  function persist() {
    const position = engine.position();
    if (!position) return;
    void saveProgress(
      workspace,
      current.id,
      position,
      progressPercent(current, position),
      mode,
    ).then(() => refresh());
  }

  function chooseMode(next: ReadingMode) {
    setMode(next);
    engine.setMode(next);
  }

  return (
    <TooltipProvider>
      <div className="reader-surface flex min-h-svh flex-col">
        <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            asChild
            variant="ghost"
            className={`${controlClass} shrink-0 px-2 text-muted-foreground`}
          >
            <Link to={`/read/${current.id}`}>Page</Link>
          </Button>
          <p className="min-w-0 flex-1 truncate text-center font-serif text-[0.95rem]">
            {current.metadata.title}
          </p>
          <Badge className="shrink-0 border-border bg-transparent font-mono tabular-nums text-muted-foreground">
            {state.finished ? 'End' : remainingLabel(left, wpm)}
          </Badge>
        </header>
        <Progress value={readPercent} className="h-px rounded-none" aria-label="Reading progress" />

        <main className="flex flex-1 flex-col justify-center px-4 pb-72 pt-8 sm:px-8">
          <p className="sr-only" aria-live={frame.playing ? 'off' : 'polite'}>
            {frame.tokens.map((token) => token.text).join(' ')}
          </p>
          {state.tokenCount === 0 ? (
            <p className="text-center font-serif text-xl">This document has no readable text.</p>
          ) : mode === 'guided' ? (
            <Sentence tokens={sentence} active={active} large />
          ) : (
            <>
              <Stage tokens={frame.tokens} mark={mark} />
              {sentenceVisible ? <Sentence tokens={sentence} active={active} /> : null}
            </>
          )}
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-[var(--color-reader-background)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="pointer-events-none absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-[var(--color-reader-background)] from-30% to-transparent" />
          <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
          {state.tokenCount > 0 ? (
            <>
              <div className="flex items-center gap-3">
                <Slider
                  value={[place]}
                  min={0}
                  max={Math.max(0, state.tokenCount - 1)}
                  aria-label="Position in document"
                  aria-valuetext={`${place + 1} of ${state.tokenCount}`}
                  onValueChange={([value]) => value !== undefined && engine.seek(value)}
                />
                <span className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {place + 1} / {state.tokenCount}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <p className="font-serif text-sm">
                  {frame.playing ? 'Reading' : state.finished ? 'End' : 'Ready'}
                </p>
                <div className="flex items-center gap-2">
                  <Tip label="Previous sentence · Up">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-11 text-foreground"
                      aria-label="Previous sentence"
                      onClick={() => engine.jumpSentence(-1)}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                  </Tip>
                  <Button
                    type="button"
                    className="h-14 w-14 rounded-full"
                    aria-pressed={frame.playing}
                    aria-label={frame.playing ? 'Pause' : state.finished ? 'Replay' : 'Play'}
                    onClick={() => {
                      if (frame.playing) {
                        engine.pause();
                        persist();
                      } else engine.play();
                    }}
                  >
                    {frame.playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </Button>
                  <Tip label="Next sentence · Down">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-11 text-foreground"
                      aria-label="Next sentence"
                      onClick={() => engine.jumpSentence(1)}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </Tip>
                </div>
                <p className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                  {wpm} wpm
                </p>
              </div>
              <div className="grid grid-cols-5" role="toolbar" aria-label="Reading mode">
                <Link
                  to={`/read/${current.id}`}
                  className="inline-flex h-11 items-center justify-center border-b-2 border-transparent font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Page
                </Link>
                <Tabs
                  value={mode}
                  onValueChange={(value) => chooseMode(value as ReadingMode)}
                  className="col-span-4"
                >
                  <TabsList className="grid h-11 w-full grid-cols-4 gap-0 rounded-none bg-transparent p-0">
                    {modes.map((item) => (
                      <TabsTrigger
                        key={item.id}
                        value={item.id}
                        title={item.hint}
                        className="h-11 rounded-none border-b-2 border-transparent bg-transparent px-1 font-mono text-[10px] uppercase tracking-[0.14em] shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        {item.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <p className="text-center font-serif text-sm text-muted-foreground">{modeHint}</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11 font-mono"
                  aria-label="Slower by 10 words per minute"
                  onClick={() => setWpm((value) => clampWpm(value - 10))}
                >
                  −10
                </Button>
                <Slider
                  value={[wpm]}
                  min={WPM_MIN}
                  max={WPM_MAX}
                  step={10}
                  aria-label="Words per minute"
                  aria-valuetext={`${wpm} words per minute`}
                  onValueChange={([value]) => value !== undefined && setWpm(clampWpm(value))}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11 font-mono"
                  aria-label="Faster by 10 words per minute"
                  onClick={() => setWpm((value) => clampWpm(value + 10))}
                >
                  +10
                </Button>
              </div>
              {mode === 'chunk' ? (
                <div
                  className="flex flex-wrap items-center justify-center gap-1"
                  role="group"
                  aria-label="Words at a time"
                >
                  <span className="px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Words
                  </span>
                  {sizes.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant={chunk === size ? 'default' : 'ghost'}
                      className="min-h-11 min-w-11 font-mono"
                      aria-pressed={chunk === size}
                      aria-label={`${size} words at a time`}
                      onClick={() => setChunk(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              ) : null}
              {mode !== 'guided' ? (
                <div className="flex items-center justify-center gap-3">
                  <Label
                    htmlFor="speed-sentence"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Sentence
                  </Label>
                  <Switch
                    id="speed-sentence"
                    checked={showSentence}
                    onCheckedChange={setShowSentence}
                    aria-label="Show the current sentence"
                  />
                </div>
              ) : null}
            </>
          ) : null}
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
