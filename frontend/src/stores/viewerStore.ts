import { useEffect, useState } from 'react';
import type { Locale } from '../types/viewer';

export function useViewerPreferences() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('viewer-theme') as 'dark' | 'light') || 'dark');
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('viewer-locale') as Locale) || 'en');
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('viewer-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = locale; localStorage.setItem('viewer-locale', locale); }, [locale]);
  return { theme, setTheme, locale, setLocale, navOpen, setNavOpen };
}
