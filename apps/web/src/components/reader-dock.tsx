import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Button, Slider } from '@locked-in/ui';

const modes = [
  { id: 'orp', label: 'Focus' },
  { id: 'rsvp', label: 'Flash' },
  { id: 'chunk', label: 'Phrase' },
  { id: 'guided', label: 'Guide' },
] as const;

const modeClass =
  'inline-flex h-11 min-w-0 items-center justify-center border-b-2 px-1 font-mono text-[10px] uppercase tracking-[0.14em]';

function release(dirty: { current: boolean }, commit: () => void) {
  return () => {
    if (!dirty.current) return;
    dirty.current = false;
    commit();
  };
}

export function ReaderDock({
  documentId,
  place,
  total,
  label,
  listening,
  paused,
  onToggle,
  onSkip,
  onScrub,
  onScrubCommit,
  rate,
  onRate,
  pitch,
  onPitch,
  onSpeechCommit,
  voice,
  onVoice,
  fontSize,
  onFont,
  headings,
  onHeading,
}: {
  documentId: string;
  place: number;
  total: number;
  label: string;
  listening: boolean;
  paused: boolean;
  onToggle: () => void;
  onSkip: (delta: number) => void;
  onScrub: (index: number) => void;
  onScrubCommit: (index: number) => void;
  rate: number;
  onRate: (rate: number) => void;
  pitch: number;
  onPitch: (pitch: number) => void;
  onSpeechCommit: () => void;
  voice: string | undefined;
  onVoice: (voice: string) => void;
  fontSize: number;
  onFont: (size: number) => void;
  headings: Array<{ id: string; title: string; blockId?: string }>;
  onHeading: (blockId: string) => void;
}) {
  const [tune, setTune] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const scrubbed = useRef(false);
  const voiced = useRef(false);
  const placeRef = useRef(place);
  placeRef.current = place;
  const atStart = place <= 0;
  const atEnd = total === 0 || place >= total - 1;
  const playing = listening && !paused;

  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const load = () => setVoices([...speechSynthesis.getVoices()]);
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !tune) return;
      event.stopPropagation();
      setTune(false);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [tune]);

  const endScrub = release(scrubbed, () => onScrubCommit(placeRef.current));
  const endVoice = release(voiced, onSpeechCommit);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[var(--color-reader-background)] pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-[var(--color-reader-background)] from-30% to-transparent" />
      {tune ? (
        <div className="mx-auto max-h-[58vh] max-w-xl space-y-4 overflow-y-auto border-b border-border px-5 py-4">
          <div>
            <p className="font-serif text-lg leading-none">Voice</p>
            <p className="mt-1 text-sm text-muted-foreground">Pace, tone, and type for this page.</p>
          </div>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Speaker
            </span>
            <select
              className="mt-2 h-11 w-full border border-border bg-transparent px-3 text-sm"
              value={voice ?? ''}
              onChange={(event) => onVoice(event.target.value)}
              aria-label="Voice"
            >
              <option value="">System</option>
              {voices.map((item) => (
                <option key={`${item.name}-${item.lang}`} value={item.name}>
                  {item.name} · {item.lang}
                </option>
              ))}
            </select>
          </label>
          <div onPointerUp={endVoice} onKeyUp={endVoice}>
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Pace</span>
              <span className="tabular-nums">{rate.toFixed(1)}×</span>
            </div>
            <Slider
              value={[rate]}
              min={0.5}
              max={3}
              step={0.1}
              aria-label="Speaking pace"
              aria-valuetext={`${rate.toFixed(1)} times`}
              onValueChange={([value]) => {
                if (value === undefined) return;
                voiced.current = true;
                onRate(Math.round(value * 10) / 10);
              }}
            />
          </div>
          <div onPointerUp={endVoice} onKeyUp={endVoice}>
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Tone</span>
              <span className="tabular-nums">{pitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[pitch]}
              min={0.5}
              max={2}
              step={0.1}
              aria-label="Voice pitch"
              aria-valuetext={`pitch ${pitch.toFixed(1)}`}
              onValueChange={([value]) => {
                if (value === undefined) return;
                voiced.current = true;
                onPitch(Math.round(value * 10) / 10);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Type
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-11"
                aria-label="Smaller type"
                onClick={() => onFont(Math.max(12, fontSize - 2))}
              >
                A−
              </Button>
              <span className="w-8 text-center font-mono text-xs tabular-nums">{fontSize}</span>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-11"
                aria-label="Larger type"
                onClick={() => onFont(Math.min(48, fontSize + 2))}
              >
                A+
              </Button>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Contents
            </p>
            {headings.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No headings in this document.</p>
            ) : (
              <ul className="mt-2">
                {headings.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center text-left font-serif text-base hover:text-accent"
                      onClick={() => {
                        if (!entry.blockId) return;
                        onHeading(entry.blockId);
                        setTune(false);
                      }}
                    >
                      {entry.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-xl flex-col gap-1 px-4 pb-2 pt-3">
        <div
          className="flex items-center gap-3"
          onPointerUp={endScrub}
          onKeyUp={endScrub}
        >
          <Slider
            value={[total ? place : 0]}
            min={0}
            max={Math.max(0, total - 1)}
            disabled={total === 0}
            aria-label="Place in the document"
            aria-valuetext={label}
            onValueChange={([value]) => {
              if (value === undefined) return;
              scrubbed.current = true;
              placeRef.current = value;
              onScrub(value);
            }}
          />
          <span className="w-16 shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
            {label}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <p className="truncate font-serif text-sm" aria-live="polite">
            {playing ? 'Listening' : listening ? 'Paused' : 'Listen'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 text-foreground"
              aria-label="Previous passage"
              disabled={atStart}
              onClick={() => onSkip(-1)}
            >
              <SkipBack className="size-5" strokeWidth={1.75} />
            </Button>
            <Button
              type="button"
              className="h-14 w-14 rounded-full"
              aria-label={playing ? 'Pause' : 'Play'}
              aria-pressed={playing}
              onClick={onToggle}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 text-foreground"
              aria-label="Next passage"
              disabled={atEnd}
              onClick={() => onSkip(1)}
            >
              <SkipForward className="size-5" strokeWidth={1.75} />
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 font-mono text-[10px] uppercase tracking-[0.16em]"
              aria-expanded={tune}
              onClick={() => setTune((value) => !value)}
            >
              {tune ? 'Close' : 'Voice'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5" role="toolbar" aria-label="Reading mode">
          <span className={`${modeClass} border-primary text-foreground`}>Page</span>
          {modes.map((mode) => (
            <Link
              key={mode.id}
              to={`/speed/${documentId}?mode=${mode.id}`}
              className={`${modeClass} border-transparent text-muted-foreground hover:text-foreground`}
            >
              {mode.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
