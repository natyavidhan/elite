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
    paper100: '#FAF9F5',
    paper200: '#F2F1EA',
    paper300: '#E6E3D6',
    paper400: '#D6D2BE',
    paper500: '#BFB99C',
    ink900: '#201E19',
    ink700: '#4A473D',
    ink500: '#79765F',
    ink300: '#A6A38A',
  },
  dark: {
    paper100: '#211F1A',
    paper200: '#17160F',
    paper300: '#29271D',
    paper400: '#3A3728',
    paper500: '#4F4B36',
    ink900: '#F2EFE3',
    ink700: '#C7C2A8',
    ink500: '#948E6E',
    ink300: '#5C5840',
  },
} as const;
