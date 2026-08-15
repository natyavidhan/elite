import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          100: '#FBF6EA',
          200: '#F6EFDF',
          300: '#EDE3CC',
          400: '#DDCFAE',
          500: '#C9B891',
        },
        ink: {
          900: '#201B15',
          700: '#4A4136',
          500: '#7A6F5E',
          300: '#A79C88',
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
