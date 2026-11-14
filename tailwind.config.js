/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,html}",
  ],
  safelist: [
    'col-span-12', 'col-span-6', 'col-span-4', 'col-span-3', 'col-span-8',
    'md:col-span-12', 'md:col-span-6', 'md:col-span-4', 'md:col-span-3', 'md:col-span-8',
    'sm:col-span-6', 'sm:col-span-12',
  ],
  theme: {
    extend: {
      fontFamily: {
        title:          ['var(--font-display)', '"Barlow Condensed"', 'sans-serif'],
        sans:           ['var(--font-body)', '"Inter Tight"', 'sans-serif'],
        mono:           ['var(--font-input)', '"JetBrains Mono"', 'monospace'],
        hud:            ['var(--font-hud)', '"Inter Tight"', 'sans-serif'],
        tierlist:       ['var(--font-tierlist)', '"Barlow Condensed"', 'sans-serif'],
        'wiki-serif':   ['var(--font-display)', '"Barlow Condensed"', 'serif'],
        'wiki-heading': ['var(--font-display)', '"Barlow Condensed"', 'sans-serif'],
      },
      colors: {
        /* ── Fondos ── */
        cyber: {
          black:  '#0a0a0a',
          dark:   '#111111',
          panel:  '#161616',
          panel2: '#1c1c1c',
          border: 'rgba(0,240,255,0.15)',
        },
        /* ── Acento principal ── */
        neon: {
          cyan:   '#00F0FF',
          red:    '#FF003C',
          yellow: '#E0FF00',
          white:  '#FFFFFF',
          muted:  'rgba(255,255,255,0.45)',
          subtle: 'rgba(255,255,255,0.12)',
        },
        /* ── HUD extras ── */
        hud: {
          green:  '#00FF88',
          orange: '#FF8C00',
          purple: '#A855F7',
        },
      },
    },
  },
  plugins: [],
};
