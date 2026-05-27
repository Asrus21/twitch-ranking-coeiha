'use client';

import { useApp } from './AppProvider';

export function Header() {
  const { theme, toggleTheme, lang, toggleLang, t, isAdmin } = useApp();

  const openAdmin = () => {
    window.dispatchEvent(new CustomEvent('coeiha:open-admin'));
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg)]/70 border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-hotpink-500 glow-pink group-hover:animate-glow">
            <img
              src="/logo.png"
              alt="logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-hotpink-500 to-hotpink-700 text-white font-display text-2xl -z-10">
              C
            </div>
          </div>
          <span className="font-display text-2xl tracking-wider text-[var(--fg)]">
            asrus<span className="text-hotpink-500">.</span>app
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm uppercase tracking-widest">
          <a href="#about" className="hover:text-hotpink-500 transition-colors">
            {t.nav.about}
          </a>
          <a href="#ranking" className="hover:text-hotpink-500 transition-colors">
            {t.nav.ranking}
          </a>
          <a href="#live" className="hover:text-hotpink-500 transition-colors">
            {t.nav.live}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-mono font-bold hover:bg-hotpink-500 hover:text-white hover:border-hotpink-500 transition-all uppercase"
            aria-label="toggle language"
          >
            {lang === 'pt' ? 'PT' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-hotpink-500 hover:text-white hover:border-hotpink-500 transition-all"
            aria-label="toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={openAdmin}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              isAdmin
                ? 'bg-hotpink-500 text-white border-hotpink-500 glow-pink'
                : 'border-[var(--border)] text-[var(--fg)] hover:bg-hotpink-500 hover:text-white hover:border-hotpink-500'
            }`}
            aria-label="admin panel"
            title="Admin"
          >
            {isAdmin ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
