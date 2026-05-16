'use client';

import { useEffect } from 'react';

const colors = {
  light: '#f8fafc',
  dark: '#0b1020',
  rose: '#321327',
};

function resolveThemeColor(theme: string | null): string {
  if (theme === 'light') {
    return colors.light;
  }

  if (theme === 'rose') {
    return colors.rose;
  }

  return colors.dark;
}

/** Keeps browser theme-color metadata aligned to the selected app theme. */
export function ThemeColorMeta(): null {
  useEffect(() => {
    const element = document.getElementById('theme-color-meta');
    const theme = document.documentElement.dataset.theme ?? window.localStorage.getItem('fit_theme');
    element?.setAttribute('content', resolveThemeColor(theme));
  }, []);

  return null;
}
