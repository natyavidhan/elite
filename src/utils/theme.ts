export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_KEY = 'elite:theme';

export function getStoredTheme(): ThemePreference {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return pref;
}

export function applyTheme(pref: ThemePreference): void {
  document.documentElement.classList.toggle('dark', resolveTheme(pref) === 'dark');
}

export function setStoredTheme(pref: ThemePreference): void {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

/** Same palette as the CSS custom properties in index.css — kept in sync by
 * hand since a few consumers (Recharts, canvas-confetti) need real color
 * values rather than CSS classes or variables. */
export const THEME_COLORS = {
  light: {
    paper100: '#FBF6EA',
    paper200: '#F6EFDF',
    paper300: '#EDE3CC',
    paper400: '#DDCFAE',
    paper500: '#C9B891',
    ink900: '#201B15',
    ink700: '#4A4136',
    ink500: '#7A6F5E',
    ink300: '#A79C88',
  },
  dark: {
    paper100: '#241F1A',
    paper200: '#1B1712',
    paper300: '#2C2721',
    paper400: '#3A332A',
    paper500: '#4D4436',
    ink900: '#EDE3CC',
    ink700: '#C4B896',
    ink500: '#8F8266',
    ink300: '#5C5443',
  },
} as const;
