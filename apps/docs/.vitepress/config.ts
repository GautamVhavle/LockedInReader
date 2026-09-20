import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Locked In Reader',
  description: 'Open-source, local-first reading OS',
  outDir: 'dist',
  themeConfig: {
    nav: [
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Self-hosting', link: '/self-hosting' },
      { text: 'Plugins', link: '/plugins' },
    ],
    sidebar: [
      { text: 'Overview', link: '/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Self-hosting', link: '/self-hosting' },
      { text: 'AI providers', link: '/ai-providers' },
      { text: 'Plugins', link: '/plugins' },
      { text: 'Themes', link: '/themes' },
    ],
  },
});
