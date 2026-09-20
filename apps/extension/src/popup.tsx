import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@locked-in/ui';
import './styles.css';

function Popup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="font-serif text-xl">Locked In</h1>
      <Button
        onClick={() => {
          void chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
        }}
      >
        Open side panel
      </Button>
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
