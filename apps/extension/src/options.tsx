import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function Options() {
  return (
    <div className="p-8">
      <h1 className="font-serif text-3xl">Locked In options</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        The extension only requests page access to extract readable content. No remote code is executed. Reading still
        works fully in the PWA without an account.
      </p>
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
