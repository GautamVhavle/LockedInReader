import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createHighlight, createNote } from '@locked-in/annotation';
import { progressPercent, isBoilerplate } from '@locked-in/core';
import { saveProgress } from '@locked-in/library';
import { BrowserTTSProvider, speechParts } from '@locked-in/audio-engine';
import type { CanonicalDocument, Highlight } from '@locked-in/types';
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
  const navigate = useNavigate();
  const document = documents.find((item) => item.id === id);
  const [focus, setFocus] = useState(false);
  const [listening, setListening] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState(settings.fontSizePx);
  const [noteDraft, setNoteDraft] = useState<string>();
  const [selection, setSelection] = useState<{
    text: string;
    blockId: string;
    start: number;
    end: number;
  }>();
  const tts = useMemo(() => new BrowserTTSProvider(), []);
  const related = useMemo(
    () => highlights.filter((item) => item.documentId === id),
    [highlights, id],
  );

  useEffect(() => {
    setFontSize(settings.fontSizePx);
  }, [settings.fontSizePx]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey && !typing) {
        setFocus((value) => !value);
      }
      if (event.key === 'Escape') {
        setFocus(false);
        setTocOpen(false);
        setSelection(undefined);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!document) return;
    const saved = progress.find((item) => item.documentId === document.id);
    if (!saved) return;
    const node = window.document.getElementById(saved.position.blockId);
    node?.scrollIntoView({ block: 'center' });
  }, [document, progress]);

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

  async function toggleListen() {
    if (listening) {
      await tts.stop();
      setListening(false);
      return;
    }
    const parts = speechParts(body);
    if (parts.length === 0) return;
    setListening(true);
    try {
      await tts.start();
      for (const text of parts) {
        await tts.speak({ text, rate: settings.ttsRate });
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'Speech failed') {
        toast.error('This browser could not speak the page');
      }
    } finally {
      setListening(false);
    }
  }

  async function rememberFont(next: number) {
    setFontSize(next);
    await workspace.settings.save({ ...settings, fontSizePx: next });
    await refresh();
  }

  return (
    <div className="reader-surface min-h-screen">
      {!focus ? (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[var(--color-reader-background)]/90 px-5 py-3 backdrop-blur">
          <Link
            to="/desk"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Desk
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
            <button type="button" onClick={() => setTocOpen((value) => !value)}>
              Contents
            </button>
            <button type="button" onClick={() => void rememberFont(Math.max(16, fontSize - 2))}>
              A−
            </button>
            <button type="button" onClick={() => void rememberFont(Math.min(32, fontSize + 2))}>
              A+
            </button>
            <button type="button" onClick={() => setFocus(true)}>
              Focus
            </button>
            <button type="button" onClick={() => void toggleListen()}>
              {listening ? 'Stop' : 'Listen'}
            </button>
            <button type="button" onClick={() => navigate(`/speed/${current.id}`)}>
              Speed
            </button>
          </div>
        </header>
      ) : null}

      {tocOpen ? (
        <nav className="border-b border-border px-6 py-4">
          {headings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No headings in this document.</p>
          ) : (
            headings.map((entry) => (
              <a
                key={entry.id}
                href={`#${entry.blockId ?? entry.id}`}
                className="block py-1 text-sm text-foreground/80"
              >
                {entry.title}
              </a>
            ))
          )}
        </nav>
      ) : null}

      <article
        className="mx-auto max-w-[42rem] px-6 py-16"
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
            if (block.type === 'heading') {
              const Heading = (block.level && block.level <= 2 ? 'h2' : 'h3') as 'h2' | 'h3';
              return (
                <Heading
                  key={block.id}
                  id={block.id}
                  className="mb-4 mt-12 font-serif text-[1.45em] leading-tight"
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
                  className="my-6 border-l-2 border-accent pl-4 italic"
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
                  className="mb-2 ml-5 list-disc"
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
                className="mb-[0.9em]"
                onMouseUp={() => onSelect(block.id, block.text)}
              >
                {renderText(block.text, marks)}
              </p>
            );
          })}
        </div>
      </article>

      {selection ? (
        <div className="fixed bottom-6 left-1/2 z-20 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 border border-border bg-background p-3 text-foreground shadow-lg">
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

      {focus ? (
        <button
          type="button"
          className="fixed right-4 top-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
          onClick={() => setFocus(false)}
        >
          Esc
        </button>
      ) : null}
    </div>
  );
}
