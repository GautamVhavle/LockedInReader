import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { themeClass } from '@locked-in/themes';
import type { ProductTheme } from '@locked-in/types';
import { Button, ThemeSwitcher } from '@locked-in/ui';
import { useLibrary } from '../lib/library-state.js';
import { workspace } from '../lib/platform.js';

const VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4';

const stats = [
  { value: '4', label: 'Reading modes' },
  { value: '1,200', label: 'Words per minute' },
  { value: '5', label: 'File types' },
  { value: '0', label: 'Accounts required' },
];

export function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { settings, refresh } = useLibrary();
  const { setTheme } = useTheme();

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setReduced(media.matches);
      if (media.matches) videoRef.current?.pause();
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  async function chooseTheme(theme: ProductTheme) {
    await workspace.settings.save({ ...settings, theme });
    document.documentElement.className = themeClass(theme);
    setTheme(theme);
    await refresh();
  }

  function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <div className="relative h-svh overflow-hidden bg-black text-white">
      <div className="absolute inset-0 overflow-hidden bg-black">
        {reduced ? null : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={VIDEO} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />
      </div>
      <p className="sr-only">Background footage with no dialogue.</p>

      <div className="relative z-10 flex h-full flex-col px-4 py-4 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/desk" className="font-serif text-lg tracking-tight">
            Locked In
          </Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="Primary">
            <Link
              to="/desk"
              className="hidden min-h-11 items-center px-3 text-white/70 hover:text-white sm:flex"
            >
              Desk
            </Link>
            <Link
              to="/library"
              className="hidden min-h-11 items-center px-3 text-white/70 hover:text-white sm:flex"
            >
              Library
            </Link>
            <Button asChild className="min-h-11 rounded-full px-5">
              <Link to="/desk">Open the desk</Link>
            </Button>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
            Local-first reading
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,8vw,5.5rem)] leading-[1.02] tracking-tight text-white">
            <span className="block">Read faster.</span>
            <span className="block">Stay with the sentence.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#d0d0d0]">
            Import a book, capture a webpage, or flash one word at a time. The document stays in
            this browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="min-h-11 rounded-full px-6">
              <Link to="/desk">Get started</Link>
            </Button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/30 px-5 text-sm text-white/80 hover:text-white"
              onClick={toggleVideo}
              disabled={reduced}
            >
              {reduced ? 'Motion off' : paused ? 'Play footage' : 'Pause footage'}
            </button>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-3xl pb-2">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-3xl tabular-nums tracking-tight text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-[#a39e92]">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
              Desk theme
            </p>
            <ThemeSwitcher value={settings.theme} onChange={(theme) => void chooseTheme(theme)} />
          </div>
        </footer>
      </div>
    </div>
  );
}
