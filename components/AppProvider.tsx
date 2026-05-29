'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { translations, type Lang, type Translations } from '@/lib/i18n';
import type { GameEntry, GameCollection } from '@/lib/db';

type Theme = 'light' | 'dark';

export type AboutData = {
  textPt: string | null;
  textEn: string | null;
  imageUrl: string | null;
  imagePosition: string | null;
  logoUrl: string | null;
  links: string | null;
};

export { type GameEntry, type GameCollection };

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: Translations;
  // about content (editable by admin)
  about: AboutData;
  refreshAbout: () => Promise<void>;
  // games
  games: GameEntry[];
  refreshGames: () => Promise<void>;
  addGameToList: (game: GameEntry) => void;
  removeGameFromList: (id: number) => void;
  applyGames: (games: GameEntry[]) => void;
  // admin session
  adminPassword: string | null;
  isAdmin: boolean;
  adminLogin: (password: string) => Promise<boolean>;
  adminLogout: () => void;
};

const Context = createContext<Ctx | null>(null);

const DEFAULT_ABOUT: AboutData = {
  textPt: null,
  textEn: null,
  imageUrl: null,
  imagePosition: null,
  logoUrl: null,
  links: null,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lang, setLangState] = useState<Lang>('pt');
  const [mounted, setMounted] = useState(false);
  const [about, setAbout] = useState<AboutData>(DEFAULT_ABOUT);
  const [games, setGames] = useState<GameEntry[]>([]);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedLang = localStorage.getItem('lang') as Lang | null;
    const storedAdmin = sessionStorage.getItem('coeiha_admin');
    if (storedTheme) setThemeState(storedTheme);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      setThemeState('dark');
    if (storedLang === 'en' || storedLang === 'pt') setLangState(storedLang);
    if (storedAdmin) setAdminPassword(storedAdmin);
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

  const refreshAbout = useCallback(async () => {
    try {
      const res = await fetch('/api/coeiha/about', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as AboutData;
        setAbout(data);
      }
    } catch (e) {
      console.error('[refreshAbout]', e);
    }
  }, []);

  const refreshGames = useCallback(async () => {
    try {
      // timestamp param busts any Vercel Edge CDN cache
      const res = await fetch(`/api/coeiha/games?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as GameEntry[];
        setGames(data);
      }
    } catch (e) {
      console.error('[refreshGames]', e);
    }
  }, []);

  const addGameToList = useCallback((game: GameEntry) => {
    setGames((prev) => [...prev, game]);
  }, []);

  const removeGameFromList = useCallback((id: number) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const applyGames = useCallback((incoming: GameEntry[]) => {
    setGames(incoming);
  }, []);

  useEffect(() => {
    refreshAbout();
    refreshGames();
  }, [refreshAbout, refreshGames]);

  const adminLogin = useCallback(async (password: string) => {
    try {
      const res = await fetch('/api/coeiha/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAdminPassword(password);
        sessionStorage.setItem('coeiha_admin', password);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const adminLogout = useCallback(() => {
    setAdminPassword(null);
    sessionStorage.removeItem('coeiha_admin');
  }, []);

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
        about,
        refreshAbout,
        games,
        refreshGames,
        addGameToList,
        removeGameFromList,
        applyGames,
        adminPassword,
        isAdmin: adminPassword !== null,
        adminLogin,
        adminLogout,
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
