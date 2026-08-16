import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // rgb(var(...) / <alpha-value>) is the standard pattern for a
        // Tailwind color that swaps value under a CSS class (see .dark in
        // index.css) while still supporting opacity modifiers like /25.
        paper: {
          100: 'rgb(var(--color-paper-100) / <alpha-value>)',
          200: 'rgb(var(--color-paper-200) / <alpha-value>)',
          300: 'rgb(var(--color-paper-300) / <alpha-value>)',
          400: 'rgb(var(--color-paper-400) / <alpha-value>)',
          500: 'rgb(var(--color-paper-500) / <alpha-value>)',
        },
        ink: {
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          500: 'rgb(var(--color-ink-500) / <alpha-value>)',
          300: 'rgb(var(--color-ink-300) / <alpha-value>)',
        },
        // The highlighter — same hue in both themes, only the neutrals
        // around it change between light and dark.
        gold: {
          300: '#F0D98C',
          400: '#E0B23C',
          600: '#B8860B',
          700: '#96700A',
          800: '#6B4F06',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        plate: '0.08em',
      },
      boxShadow: {
        plate: '0 1px 0 0 rgba(32, 30, 25, 0.08), 0 8px 20px -12px rgba(32, 30, 25, 0.25)',
        // A button actually lifting off the page on hover, settling back
        // down on press — the one place in this app something is meant to
        // feel physically liftable, not just paper.
        lift: '0 6px 16px -4px rgba(32, 30, 25, 0.3), 0 2px 6px -2px rgba(32, 30, 25, 0.18)',
      },
      backgroundImage: {
        'paper-grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;
