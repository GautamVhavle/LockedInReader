import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../ui/button.js';
import { Slider } from '../ui/slider.js';

export function ReaderControls({
  playing,
  wpm,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onWpm,
}: {
  playing: boolean;
  wpm: number;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onWpm: (wpm: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-4 backdrop-blur">
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous word">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={playing ? onPause : onPlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next word">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs uppercase tracking-[0.14em] text-muted-foreground">{wpm} wpm</span>
        <Slider value={[wpm]} min={80} max={1200} step={10} onValueChange={([value]) => onWpm(value ?? wpm)} aria-label="Reading speed" />
      </div>
    </div>
  );
}
