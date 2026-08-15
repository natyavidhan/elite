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
        vermilion: {
          300: '#EFA593',
          400: '#E2604A',
          600: '#C13A2A',
          700: '#A22E20',
          800: '#8B2419',
        },
      },
      fontFamily: {
        display: ['"Old Standard TT"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        plate: '0.08em',
      },
      boxShadow: {
        plate: '0 1px 0 0 rgba(32, 27, 21, 0.08), 0 8px 20px -12px rgba(32, 27, 21, 0.25)',
      },
      backgroundImage: {
        'paper-grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;
