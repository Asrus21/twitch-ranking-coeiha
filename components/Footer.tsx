'use client';

import { useApp } from './AppProvider';

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t-2 border-hotpink-500 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-2xl tracking-wider">
          asrus<span className="text-hotpink-500">.</span>app
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)]">
          {t.footer.made} <span className="text-hotpink-500">♥</span> {t.footer.by}{' '}
          asrus · {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
