import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { extractWebDocument } from '@locked-in/extraction';
import { Button } from '@locked-in/ui';
import type { PageCapture } from './content.js';
import './styles.css';

async function requestPage(): Promise<PageCapture | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return undefined;
  return chrome.tabs.sendMessage(tab.id, { type: 'LOCKED_IN_GET_PAGE' });
}

function SidePanel() {
  const [status, setStatus] = useState('Ready to capture this page.');
  const [title, setTitle] = useState('');

  async function capture(selectionOnly = false) {
    const page = await requestPage();
    if (!page) {
      setStatus('Reload the tab so the content script can attach.');
      return;
    }
    const document = extractWebDocument({
      html: page.html,
      url: page.url,
      title: page.title,
      selection: selectionOnly ? page.selection : undefined,
    });
    setTitle(document.metadata.title);
    const markdown = document.blocks.map((block) => block.text).join('\n\n');
    await chrome.storage.local.set({ lastCapture: { document, markdown, capturedAt: Date.now() } });
    setStatus(`Saved “${document.metadata.title}” locally. Download Markdown or open the PWA to import it.`);
    return markdown;
  }

  async function download() {
    const stored = await chrome.storage.local.get('lastCapture');
    const markdown = stored.lastCapture?.markdown as string | undefined;
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'capture'}.md`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Locked In</p>
      <h1 className="font-serif text-2xl">Capture</h1>
      <p className="text-sm text-muted-foreground">{status}</p>
      <Button onClick={() => void capture(false)}>Save page</Button>
      <Button variant="outline" onClick={() => void capture(true)}>
        Save selection
      </Button>
      <Button variant="outline" onClick={() => void download()}>
        Download Markdown
      </Button>
      <Button variant="ghost" onClick={() => chrome.tabs.create({ url: 'http://localhost:5173' })}>
        Open reader
      </Button>
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
