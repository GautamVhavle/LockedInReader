import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { extractWebDocument } from '@locked-in/extraction';
import { clampWpm, ReaderEngine, stageParts, WPM_DEFAULT, WPM_MAX, WPM_MIN } from '@locked-in/reader-engine';
import type { CanonicalDocument } from '@locked-in/types';
import { Button, Slider } from '@locked-in/ui';
import {
  activeTabId,
  chosenSelection,
  GET_PAGE,
  hasReadableText,
  panelStatus,
  requestPageFromTab,
  takePendingSelection,
  type PageCapture,
} from './capture.js';
import './styles.css';

const selectionSlot: { current?: Promise<string> } = {};

async function requestPage(): Promise<PageCapture | undefined> {
  const tabId = await activeTabId((info) => chrome.tabs.query(info));
  return requestPageFromTab(tabId, {
    send: async (tabId) => {
      const page = await chrome.tabs.sendMessage(tabId, { type: GET_PAGE });
      return page as PageCapture | undefined;
    },
    inject: async (tabId) => {
      const [injected] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          url: location.href,
          title: document.title,
          html: document.documentElement.outerHTML,
          selection: window.getSelection()?.toString() ?? '',
        }),
      });
      return injected?.result as PageCapture | undefined;
    },
  });
}

function Stage({ document, wpm }: { document: CanonicalDocument; wpm: number }) {
  const engine = useMemo(() => new ReaderEngine(), []);
  const [frame, setFrame] = useState(engine.currentFrame());
  const [playing, setPlaying] = useState(false);

  useEffect(
    () =>
      engine.onFrame((next) => {
        setFrame(next);
        setPlaying(next.playing);
      }),
    [engine],
  );

  useEffect(() => {
    engine.load(document);
    engine.setMode('orp');
    setFrame(engine.currentFrame());
  }, [document, engine]);

  useEffect(() => {
    engine.setSpeed(wpm);
  }, [engine, wpm]);

  const parts = stageParts(frame.tokens);
  return (
    <div className="flex flex-col gap-4">
      <div className="stage" data-mark="true" aria-hidden="true">
        <span className="stage-side stage-before">{parts?.before}</span>
        <span className="stage-pivot">{parts?.pivot ?? '·'}</span>
        <span className="stage-side stage-after">{parts?.after}</span>
      </div>
      <Button
        type="button"
        className="min-h-11"
        disabled={!playing && frame.tokens.length === 0}
        onClick={() => {
          if (playing) engine.pause();
          else engine.play();
        }}
      >
        {playing ? 'Pause' : frame.tokens.length === 0 ? 'Nothing to read' : 'Read'}
      </Button>
    </div>
  );
}

function SidePanel() {
  const [status, setStatus] = useState('Reading this page…');
  const [document, setDocument] = useState<CanonicalDocument | undefined>();
  const [wpm, setWpm] = useState(WPM_DEFAULT);

  useEffect(() => {
    void (async () => {
      const storedSelection = await takePendingSelection(
        selectionSlot,
        () => chrome.storage.session.get('pendingSelection'),
        () => chrome.storage.session.remove('pendingSelection'),
      );
      const page = await requestPage();
      const selection = chosenSelection(storedSelection, page?.selection);
      const captured = page?.html
        ? extractWebDocument({
            html: page.html,
            url: page.url,
            title: page.title,
            selection: selection || undefined,
          })
        : undefined;
      const readable = captured ? hasReadableText(captured.blocks) : false;
      setStatus(
        panelStatus({
          html: page?.html,
          readable,
          selection,
          wordCount: captured?.metadata.wordCount ?? 0,
        }),
      );
      if (captured && readable) setDocument(captured);
    })().catch(() =>
      setStatus(panelStatus({ html: undefined, readable: false, selection: '', wordCount: 0 })),
    );
  }, []);

  const preview = document?.blocks
    .filter((block) => block.text)
    .slice(0, 4)
    .map((block) => block.text)
    .join(' ');

  return (
    <div className="reader-surface flex min-h-svh flex-col gap-4 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Locked In
      </p>
      <h1 className="font-serif text-2xl leading-tight">
        {document?.metadata.title ?? 'Read this page'}
      </h1>
      <p className="text-sm text-muted-foreground">{status}</p>
      {document ? <Stage document={document} wpm={wpm} /> : null}
      <div className="flex items-center gap-3">
        <span className="w-16 font-mono text-[11px] tabular-nums">{wpm} wpm</span>
        <Slider
          value={[wpm]}
          min={WPM_MIN}
          max={WPM_MAX}
          step={10}
          aria-label="Words per minute"
          onValueChange={([value]) => value !== undefined && setWpm(clampWpm(value))}
        />
      </div>
      {preview ? (
        <p className="max-h-40 overflow-auto text-sm leading-relaxed text-muted-foreground">
          {preview}
        </p>
      ) : null}
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SidePanel />
    </StrictMode>,
  );
}
