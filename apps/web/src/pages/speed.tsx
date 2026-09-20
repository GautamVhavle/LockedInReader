import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { progressPercent } from '@locked-in/core';
import { saveProgress } from '@locked-in/library';
import { ReaderEngine } from '@locked-in/reader-engine';
import type { ReadingMode } from '@locked-in/types';
import { Slider } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { workspace } from '../lib/platform.js';

const modes: Array<{ id: ReadingMode; label: string }> = [
  { id: 'orp', label: 'ORP' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'chunk', label: 'Chunk' },
  { id: 'guided', label: 'Guided' },
];

export function SpeedPage() {
  const { id } = useParams();
  const { documents, settings, progress, ready } = useLibrary();
  const navigate = useNavigate();
  const document = documents.find((item) => item.id === id);
  const engine = useMemo(() => new ReaderEngine(), []);
  const loadedId = useRef<string | undefined>(undefined);
  const [frame, setFrame] = useState(engine.currentFrame());
  const [mode, setMode] = useState<ReadingMode>(
    progress.find((item) => item.documentId === id)?.lastMode === 'normal'
      ? 'orp'
      : (progress.find((item) => item.documentId === id)?.lastMode ?? 'orp'),
  );
  const [wpm, setWpm] = useState(settings.wpm);

  useEffect(() => {
    if (!document) return;
    if (loadedId.current !== document.id) {
      engine.load(document);
      const saved = progress.find((item) => item.documentId === document.id);
      if (saved?.position.wordIndex !== undefined) engine.seek(saved.position.wordIndex);
      loadedId.current = document.id;
    }
    return engine.onFrame(setFrame);
  }, [document, engine, progress]);

  useEffect(() => {
    engine.setMode(mode);
    engine.setSpeed(wpm);
    engine.setChunkSize(settings.chunkSize);
  }, [engine, mode, settings.chunkSize, wpm]);

  useEffect(() => {
    async function persistNow() {
      const position = engine.position();
      if (!position || !document) return;
      await saveProgress(workspace, document.id, position, progressPercent(document, position), mode);
    }
    function onKey(event: KeyboardEvent) {
      if (event.code === 'Space') {
        event.preventDefault();
        if (engine.getState().playing) {
          engine.pause();
          void persistNow();
        } else engine.play();
      }
      if (event.key === 'ArrowRight') engine.next();
      if (event.key === 'ArrowLeft') engine.previous();
      if (event.key === 'Escape') navigate(`/read/${id}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [document, engine, id, mode, navigate]);

  if (!ready) return <p className="p-8 text-muted-foreground">Opening…</p>;
  if (!document) return <p className="p-8">That document is not on this device.</p>;
  const current = document;
  const token = frame.tokens[0];
  const letters = token ? [...token.text] : [];
  const orp = token && mode !== 'chunk' ? token.orpIndex : 0;
  const remaining = Math.max(0, engine.getState().tokenCount - frame.index);

  async function persist() {
    const position = engine.position();
    if (!position) return;
    await saveProgress(workspace, current.id, position, progressPercent(current, position), mode);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to={`/read/${current.id}`} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Page
        </Link>
        <div className="flex flex-wrap justify-center gap-4">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                engine.setMode(item.id);
                setMode(item.id);
              }}
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                mode === item.id ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">{remaining}</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {mode === 'guided' ? (
          <p className="max-w-xl text-center font-serif text-2xl leading-relaxed text-foreground/90">
            {current.blocks.find((block) => block.id === token?.blockId)?.text}
          </p>
        ) : mode === 'chunk' ? (
          <p className="text-center font-serif text-4xl tracking-tight md:text-5xl">
            {frame.tokens.map((item) => item.text).join(' ')}
          </p>
        ) : (
          <div className="aperture grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-baseline font-serif text-5xl tracking-tight md:text-7xl">
            <span className="text-right text-foreground/85">{letters.slice(0, orp).join('')}</span>
            <span className="orp-letter px-0.5">{letters[orp] ?? '·'}</span>
            <span className="text-left text-foreground/85">{letters.slice(orp + 1).join('')}</span>
          </div>
        )}
      </div>

      <footer className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 pb-10">
        <div className="filament w-full">
          <span style={{ width: `${frame.progress * 100}%` }} />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="h-11 min-w-24 border border-border px-4 font-mono text-[10px] uppercase tracking-[0.18em]"
            onClick={() => {
              if (frame.playing) {
                engine.pause();
                void persist();
              } else engine.play();
            }}
          >
            {frame.playing ? 'Pause' : 'Play'}
          </button>
          <span className="w-16 font-mono text-xs text-muted-foreground">{wpm} wpm</span>
          <Slider
            value={[wpm]}
            min={120}
            max={900}
            step={10}
            onValueChange={([value]) => {
              if (!value) return;
              setWpm(value);
              engine.setSpeed(value);
            }}
            aria-label="Words per minute"
          />
        </div>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Space play · arrows step · Esc page
        </p>
      </footer>
    </div>
  );
}
