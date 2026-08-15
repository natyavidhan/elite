import { useEffect, useState } from 'react';
import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme, type ThemePreference } from '@/utils/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredTheme);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  function setTheme(pref: ThemePreference) {
    setStoredTheme(pref);
    setThemeState(pref);
  }

  return { theme, resolvedTheme: resolveTheme(theme), setTheme };
}
