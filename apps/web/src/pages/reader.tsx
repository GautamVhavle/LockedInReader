import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createHighlight, createNote } from '@locked-in/annotation';
import { progressPercent, isBoilerplate } from '@locked-in/core';
import { saveProgress } from '@locked-in/library';
import { BrowserTTSProvider } from '@locked-in/audio-engine';
import type { CanonicalDocument, Highlight } from '@locked-in/types';
import { ReaderDock } from '../components/reader-dock.js';
import { useLibrary } from '../lib/library-state.js';
import { workspace } from '../lib/platform.js';

function renderText(text: string, marks: Highlight[]) {
  const sorted = [...marks].sort((a, b) => a.location.startOffset - b.location.startOffset);
  if (sorted.length === 0) return text;
  const nodes: Array<string | { key: string; text: string }> = [];
  let cursor = 0;
  for (const mark of sorted) {
    const start = Math.max(cursor, mark.location.startOffset);
    const end = Math.min(text.length, mark.location.endOffset);
    if (end <= start) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push({ key: mark.id, text: text.slice(start, end) });
    cursor = end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.map((node, index) =>
    typeof node === 'string' ? (
      <span key={`t-${index}`}>{node}</span>
    ) : (
      <mark key={node.key} className="bg-reader-highlight text-inherit">
        {node.text}
      </mark>
    ),
  );
}

function visibleBlocks(document: CanonicalDocument) {
  const first = document.blocks[0];
  if (first?.type === 'heading' && first.text.trim() === document.metadata.title.trim()) {
    return document.blocks.slice(1);
  }
  return document.blocks;
}

export function ReaderPage() {
  const { id } = useParams();
  const { documents, highlights, refresh, settings, ready, progress } = useLibrary();
  const document = documents.find((item) => item.id === id);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [fontSize, setFontSize] = useState(settings.fontSizePx);
  const [rate, setRate] = useState(settings.ttsRate);
  const [pitch, setPitch] = useState(settings.ttsPitch);
  const [voice, setVoice] = useState(settings.ttsVoice ?? '');
  const [noteDraft, setNoteDraft] = useState<string>();
  const [selection, setSelection] = useState<{
    text: string;
    blockId: string;
    start: number;
    end: number;
  }>();
  const tts = useMemo(() => new BrowserTTSProvider(), []);
  const run = useRef(0);
  const cursorRef = useRef(0);
  const listeningRef = useRef(false);
  const pausedRef = useRef(false);
  const scrubbing = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const speechDirty = useRef(false);
  const settingsRef = useRef(settings);
  const speech = useRef({ rate: settings.ttsRate, pitch: settings.ttsPitch, voice: settings.ttsVoice });
  settingsRef.current = {
    ...settings,
    ttsRate: rate,
    ttsPitch: pitch,
    ttsVoice: voice || undefined,
  };
  speech.current = { rate, pitch, voice: voice || undefined };
  pausedRef.current = paused;
  const related = useMemo(
    () => highlights.filter((item) => item.documentId === id),
    [highlights, id],
  );
  const spoken = useMemo(() => {
    if (!document) return [];
    return visibleBlocks(document).filter(
      (block) => block.text.trim() && block.type !== 'code' && block.type !== 'divider' && !isBoilerplate(block.text),
    );
  }, [document]);
  const actions = useRef({ toggle: () => {}, skip: (_delta: number) => {} });

  useEffect(() => {
    setFontSize(settings.fontSizePx);
  }, [settings.fontSizePx]);

  useEffect(() => {
    if (speechDirty.current) return;
    setRate(settings.ttsRate);
    setPitch(settings.ttsPitch);
    setVoice(settings.ttsVoice ?? '');
  }, [settings.ttsPitch, settings.ttsRate, settings.ttsVoice]);

  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimer.current);
      const spokenNow = speech.current;
      void workspace.settings.save({
        ...settingsRef.current,
        ttsRate: spokenNow.rate,
        ttsPitch: spokenNow.pitch,
        ttsVoice: spokenNow.voice,
      });
      void tts.stop();
    };
  }, [tts]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (event.key === 'Escape') {
        setSelection(undefined);
        return;
      }
      if (target.closest('input, textarea, select, button, a, [role="slider"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        actions.current.toggle();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        actions.current.skip(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        actions.current.skip(1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!document) return;
    const saved = progress.find((item) => item.documentId === document.id);
    const index = spoken.findIndex((block) => block.id === saved?.position.blockId);
    if (index >= 0) {
      cursorRef.current = index;
      setCursor(index);
    }
    // Only when the document changes. Progress updates while listening must not pull the cursor back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  useEffect(() => {
    if (!document) return;
    const saved = progress.find((item) => item.documentId === document.id);
    if (!saved) return;
    window.document.getElementById(saved.position.blockId)?.scrollIntoView({ block: 'center' });
    // Opening the page only. Later progress saves must not yank the passage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  if (!ready) {
    return <p className="p-8 text-muted-foreground">Opening the page…</p>;
  }
  if (!document) {
    return (
      <div className="p-10">
        <p className="text-muted-foreground">That document is not on this device.</p>
        <Link to="/desk" className="mt-4 inline-block text-sm underline">
          Back to desk
        </Link>
      </div>
    );
  }
  const current = document;
  const body = visibleBlocks(current);
  const minutes = Math.max(1, Math.round(current.metadata.wordCount / Math.max(180, settings.wpm)));
  const headings = current.structure.toc;

  async function persistHighlight() {
    if (!selection) return;
    const block = current.blocks.find((item) => item.id === selection.blockId);
    if (!block) return;
    const highlight = createHighlight(current, {
      documentId: current.id,
      blockId: block.id,
      startOffset: selection.start,
      endOffset: selection.end,
    });
    await workspace.annotations.saveHighlight(highlight);
    await saveProgress(
      workspace,
      current.id,
      { documentId: current.id, blockId: block.id, offset: selection.start },
      progressPercent(current, {
        documentId: current.id,
        blockId: block.id,
        offset: selection.start,
      }),
      'normal',
    );
    setSelection(undefined);
    await refresh();
    toast.success('Marked');
  }

  async function persistNote() {
    if (!selection || !noteDraft?.trim()) return;
    const note = createNote({ kind: 'document', documentId: current.id }, noteDraft.trim());
    await workspace.annotations.saveNote(note);
    setNoteDraft(undefined);
    setSelection(undefined);
    await refresh();
    toast.success('Note saved');
  }

  function onSelect(blockId: string, blockText: string) {
    const raw = window.getSelection()?.toString().trim();
    if (!raw) {
      setSelection(undefined);
      return;
    }
    const start = blockText.indexOf(raw);
    if (start < 0) return;
    setSelection({ text: raw, blockId, start, end: start + raw.length });
    setNoteDraft(raw);
  }

  function showPassage(index: number, smooth: boolean) {
    const block = spoken[index];
    if (!block) return;
    window.document.getElementById(block.id)?.scrollIntoView({
      block: 'center',
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  function moveTo(index: number, smooth: boolean) {
    const next = Math.min(spoken.length - 1, Math.max(0, index));
    cursorRef.current = next;
    setCursor(next);
    showPassage(next, smooth);
    return next;
  }

  async function playFrom(start: number) {
    if (spoken.length === 0) return;
    const token = ++run.current;
    listeningRef.current = true;
    setListening(true);
    setPaused(false);
    await tts.start();
    for (let index = start; index < spoken.length; index += 1) {
      if (token !== run.current) return;
      const block = spoken[index];
      if (!block) return;
      if (!scrubbing.current) {
        cursorRef.current = index;
        setCursor(index);
        showPassage(index, true);
      }
      void saveProgress(
        workspace,
        current.id,
        { documentId: current.id, blockId: block.id, offset: 0 },
        progressPercent(current, { documentId: current.id, blockId: block.id, offset: 0 }),
        'normal',
      );
      try {
        await tts.speak({
          text: block.text,
          rate: speech.current.rate,
          pitch: speech.current.pitch,
          voice: speech.current.voice,
        });
      } catch (caught) {
        if (token !== run.current) return;
        listeningRef.current = false;
        setListening(false);
        if (caught instanceof Error && caught.message === 'Speech failed') {
          toast.error('This browser could not speak the page');
        }
        return;
      }
    }
    if (token === run.current) {
      listeningRef.current = false;
      setListening(false);
    }
  }

  function skip(delta: number) {
    if (spoken.length === 0) return;
    scrubbing.current = false;
    const next = moveTo(cursorRef.current + delta, true);
    const was = listeningRef.current;
    setPaused(false);
    if (was) void playFrom(next);
  }

  function scrub(index: number) {
    if (spoken.length === 0) return;
    scrubbing.current = true;
    moveTo(index, false);
  }

  function scrubCommit(index: number) {
    if (spoken.length === 0) return;
    scrubbing.current = false;
    const next = moveTo(index, false);
    if (listeningRef.current && !pausedRef.current) void playFrom(next);
  }

  async function toggle() {
    if (listeningRef.current && !paused) {
      await tts.pause();
      setPaused(true);
      return;
    }
    if (listeningRef.current && paused) {
      await tts.resume();
      setPaused(false);
      return;
    }
    void playFrom(cursorRef.current);
  }

  actions.current = { toggle: () => void toggle(), skip };

  function queueSpeechSave() {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const spokenNow = speech.current;
      void patchSettings({
        ttsRate: spokenNow.rate,
        ttsPitch: spokenNow.pitch,
        ttsVoice: spokenNow.voice,
      });
    }, 280);
  }

  async function patchSettings(partial: Partial<typeof settings>) {
    const next = { ...settingsRef.current, ...partial };
    settingsRef.current = next;
    await workspace.settings.save(next);
    await refresh();
  }

  function chooseVoice(next: string) {
    speechDirty.current = true;
    setVoice(next);
    speech.current = { ...speech.current, voice: next || undefined };
    void patchSettings({ ttsVoice: next || undefined });
    if (listeningRef.current) void playFrom(cursorRef.current);
  }

  function chooseRate(next: number) {
    speechDirty.current = true;
    setRate(next);
    speech.current = { ...speech.current, rate: next };
    queueSpeechSave();
  }

  function choosePitch(next: number) {
    speechDirty.current = true;
    setPitch(next);
    speech.current = { ...speech.current, pitch: next };
    queueSpeechSave();
  }

  function commitSpeech() {
    if (listeningRef.current) void playFrom(cursorRef.current);
  }

  const passage = spoken[cursor];
  const placeLabel = spoken.length ? `${cursor + 1} / ${spoken.length}` : 'Empty';

  return (
    <div className="reader-surface min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-[var(--color-reader-background)]/90 px-5 py-3 backdrop-blur">
        <Link
          to="/desk"
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          Desk
        </Link>
        <p className="min-w-0 flex-1 truncate text-center font-serif text-sm">{current.metadata.title}</p>
      </header>

      <article
        className="mx-auto max-w-[42rem] scroll-pb-64 px-6 pb-64 pt-16"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {current.source.kind} · {current.metadata.wordCount.toLocaleString()} words · {minutes}{' '}
          min
        </p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.12] tracking-tight">
          {current.metadata.title}
        </h1>
        <div className="mt-10 font-serif text-[1.05em]">
          {body.map((block) => {
            if (block.type !== 'divider' && block.type !== 'code' && isBoilerplate(block.text)) return null;
            const marks = related.filter((item) => item.location.blockId === block.id);
            const here =
              listening && passage?.id === block.id
                ? 'shadow-[inset_2px_0_0_0_var(--color-accent)]'
                : '';
            if (block.type === 'heading') {
              const Heading = (block.level && block.level <= 2 ? 'h2' : 'h3') as 'h2' | 'h3';
              return (
                <Heading
                  key={block.id}
                  id={block.id}
                  className={`mb-4 mt-12 font-serif text-[1.45em] leading-tight ${here}`}
                >
                  {block.text}
                </Heading>
              );
            }
            if (block.type === 'code') {
              return (
                <pre
                  key={block.id}
                  className="my-6 overflow-x-auto bg-muted p-4 font-mono text-[0.8em]"
                >
                  {block.text}
                </pre>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={block.id}
                  id={block.id}
                  className={`my-6 border-l-2 border-accent pl-4 italic ${here}`}
                  onMouseUp={() => onSelect(block.id, block.text)}
                >
                  {renderText(block.text, marks)}
                </blockquote>
              );
            }
            if (block.type === 'divider')
              return <hr key={block.id} className="my-10 border-border" />;
            if (block.type === 'list-item') {
              return (
                <li
                  key={block.id}
                  id={block.id}
                  className={`mb-2 ml-5 list-disc ${here}`}
                  onMouseUp={() => onSelect(block.id, block.text)}
                >
                  {renderText(block.text, marks)}
                </li>
              );
            }
            return (
              <p
                key={block.id}
                id={block.id}
                className={`mb-[0.9em] ${here}`}
                onMouseUp={() => onSelect(block.id, block.text)}
              >
                {renderText(block.text, marks)}
              </p>
            );
          })}
        </div>
      </article>

      {selection ? (
        <div className="fixed bottom-64 left-1/2 z-40 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 border border-border bg-background p-3 text-foreground shadow-lg">
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">“{selection.text}”</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
              onClick={() => void persistHighlight()}
            >
              Mark
            </button>
            <button
              type="button"
              className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
              onClick={() => void persistNote()}
            >
              Save note
            </button>
            <button
              type="button"
              className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              onClick={() => setSelection(undefined)}
            >
              Dismiss
            </button>
          </div>
          <textarea
            className="mt-2 h-16 w-full border border-border bg-transparent p-2 text-sm outline-none"
            value={noteDraft ?? ''}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Note (optional)"
          />
        </div>
      ) : null}

      <ReaderDock
        documentId={current.id}
        place={cursor}
        total={spoken.length}
        label={placeLabel}
        listening={listening}
        paused={paused}
        onToggle={() => void toggle()}
        onSkip={skip}
        onScrub={scrub}
        onScrubCommit={scrubCommit}
        rate={rate}
        onRate={chooseRate}
        pitch={pitch}
        onPitch={choosePitch}
        onSpeechCommit={commitSpeech}
        voice={voice || undefined}
        onVoice={chooseVoice}
        fontSize={fontSize}
        onFont={(next) => {
          setFontSize(next);
          void patchSettings({ fontSizePx: next });
        }}
        headings={headings}
        onHeading={(blockId) => {
          const index = spoken.findIndex((block) => block.id === blockId);
          if (index >= 0) scrubCommit(index);
          else window.document.getElementById(blockId)?.scrollIntoView({ block: 'center' });
        }}
      />
    </div>
  );
}
