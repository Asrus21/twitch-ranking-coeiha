'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { translations, type Lang, type Translations } from '@/lib/i18n';

type Theme = 'light' | 'dark';

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: Translations;
};

const Context = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lang, setLangState] = useState<Lang>('pt');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedLang = localStorage.getItem('lang') as Lang | null;
    if (storedTheme) setThemeState(storedTheme);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      setThemeState('dark');
    if (storedLang === 'en' || storedLang === 'pt') setLangState(storedLang);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    localStorage.setItem('lang', lang);
  }, [lang, mounted]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'light' ? 'dark' : 'light')),
    []
  );
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(
    () => setLangState((l) => (l === 'pt' ? 'en' : 'pt')),
    []
  );

  return (
    <Context.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        lang,
        setLang,
        toggleLang,
        t: translations[lang],
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
