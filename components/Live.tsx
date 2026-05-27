'use client';

import { useEffect, useState } from 'react';
import { useApp } from './AppProvider';

type Status = {
  live: boolean;
  channel: string;
  title?: string;
  game?: string;
  viewers?: number;
  thumbnail?: string;
};

export function Live() {
  const { t } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/twitch-status', { cache: 'no-store' });
        if (res.ok) setStatus(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  const isLive = status?.live === true;
  const channel = status?.channel || 'coeiha';

  return (
    <section id="live" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-hotpink-500 mb-4">
            ✦ 03
          </div>
          <h2 className="font-display text-6xl md:text-7xl tracking-tight leading-none">
            {t.live.title}
          </h2>
        </div>

        <div className="rounded-3xl overflow-hidden border-2 border-hotpink-500 bg-[var(--bg-secondary)] glow-pink">
          {loading ? (
            <div className="aspect-video flex items-center justify-center text-[var(--fg-muted)] font-mono">
              {t.ranking.loading}
            </div>
          ) : isLive ? (
            <>
              {/* Twitch iframe embed when live */}
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://player.twitch.tv/?channel=${channel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'asrus.app'}&muted=true`}
                  className="w-full h-full"
                  allowFullScreen
                  title="Twitch stream"
                />
              </div>
              <div className="p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500 text-white font-bold uppercase text-xs tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {t.hero.live}
                  </div>
                  {status?.viewers !== undefined && (
                    <div className="text-sm font-mono text-[var(--fg-muted)]">
                      👁 {status.viewers.toLocaleString()} {t.live.viewers}
                    </div>
                  )}
                </div>
                <a
                  href={`https://twitch.tv/${channel}`}
                  target="_blank"
                  rel="noopener"
                  className="px-5 py-2.5 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 transition-all"
                >
                  {t.live.watch} →
                </a>
              </div>
              {status?.title && (
                <div className="px-6 pb-6">
                  <div className="text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">
                    {status.game || ''}
                  </div>
                  <div className="font-medium text-lg">{status.title}</div>
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-secondary)] to-hotpink-500/10 relative overflow-hidden">
              <div className="absolute inset-0 dotgrid opacity-30" />
              <div className="relative text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--fg-muted)] text-[var(--fg-muted)] mb-6">
                  <span className="w-2 h-2 rounded-full bg-[var(--fg-muted)]" />
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">
                    {t.hero.offline}
                  </span>
                </div>
                <div className="font-display text-5xl md:text-6xl mb-4">
                  @{channel}
                </div>
                <p className="text-[var(--fg-muted)] mb-6">{t.live.offline}</p>
                <a
                  href={`https://twitch.tv/${channel}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-hotpink-500 text-hotpink-500 font-bold uppercase text-xs tracking-widest hover:bg-hotpink-500 hover:text-white transition-all"
                >
                  {t.live.watch} →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
