'use client';

import { useEffect, useState } from 'react';
import { useApp } from './AppProvider';
import type { GameEntry, GameCollection } from '@/lib/db';

type Status = {
  live: boolean;
  channel: string;
  title?: string;
  game?: string;
  viewers?: number;
  thumbnail?: string;
};

type CollectionMeta = {
  key: GameCollection;
  labelPt: string;
  labelEn: string;
  emoji: string;
};

const COLLECTIONS: CollectionMeta[] = [
  { key: 'playing',   labelPt: 'Jogando agora',   labelEn: 'Playing now',         emoji: '🎮' },
  { key: 'favorites', labelPt: 'Favoritos',        labelEn: 'Favourites',          emoji: '⭐' },
  { key: 'finished',  labelPt: 'Zerados em live',  labelEn: 'Finished on stream',  emoji: '🏆' },
  { key: 'played',    labelPt: 'Jogados',           labelEn: 'Played',              emoji: '📋' },
];

export function Live() {
  const { t, lang } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameEntry[]>([]);
  const [activeTab, setActiveTab] = useState<GameCollection>('playing');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/coeiha/twitch-status', { cache: 'no-store' });
        if (res.ok) setStatus(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchGames = () =>
      fetch('/api/coeiha/games')
        .then((r) => r.json())
        .then((data: GameEntry[]) => {
          setGames(data);
          const first = COLLECTIONS.find((c) => data.some((g) => g.collection === c.key));
          if (first) setActiveTab((prev) => (data.some((g) => g.collection === prev) ? prev : first.key));
        })
        .catch(console.error);

    fetchGames();
    window.addEventListener('coeiha:refresh-games', fetchGames);
    return () => window.removeEventListener('coeiha:refresh-games', fetchGames);
  }, []);

  const isLive = status?.live === true;
  const channel = status?.channel || 'coeiha';
  const tabGames = games.filter((g) => g.collection === activeTab);

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
            /* ── OFFLINE: show games showcase ── */
            <div className="flex flex-col">
              {/* Offline header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-b border-hotpink-500/30">
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--fg-muted)]/40 text-[var(--fg-muted)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--fg-muted)]" />
                    <span className="text-xs font-mono uppercase tracking-widest font-bold">
                      {t.hero.offline}
                    </span>
                  </div>
                  <div className="font-display text-2xl">@{channel}</div>
                </div>
                <a
                  href={`https://twitch.tv/${channel}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-hotpink-500 text-hotpink-500 font-bold uppercase text-xs tracking-widest hover:bg-hotpink-500 hover:text-white transition-all"
                >
                  {t.live.watch} →
                </a>
              </div>

              {/* Games showcase */}
              <div className="p-6">
                <p className="text-sm text-[var(--fg-muted)] mb-6 max-w-xl">
                  {lang === 'pt'
                    ? 'Enquanto a live está offline, veja quais jogos já zerei em live, meus favoritos e o que estou jogando no momento.'
                    : "While the stream is offline, check out which games I've finished on stream, my favourites, and what I'm currently playing."}
                </p>

                {games.length > 0 ? (
                  <>
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {COLLECTIONS.map((col) => {
                        const count = games.filter((g) => g.collection === col.key).length;
                        if (count === 0) return null;
                        const isActive = activeTab === col.key;
                        return (
                          <button
                            key={col.key}
                            onClick={() => setActiveTab(col.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                              isActive
                                ? 'bg-hotpink-500 border-hotpink-500 text-white'
                                : 'border-[var(--border)] text-[var(--fg-muted)] hover:border-hotpink-500 hover:text-hotpink-500'
                            }`}
                          >
                            <span>{col.emoji}</span>
                            <span>{lang === 'pt' ? col.labelPt : col.labelEn}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[var(--border)]'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Game grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {tabGames.map((game) => (
                        <div
                          key={game.id}
                          className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)] aspect-[3/4] hover:border-hotpink-500 transition-all hover:scale-[1.03] cursor-default"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={game.imageUrl}
                            alt={game.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">
                              {game.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--fg-muted)]">
                    <span className="text-4xl">🎮</span>
                    <p className="font-mono text-sm">
                      {lang === 'pt' ? 'Nenhum jogo adicionado ainda.' : 'No games added yet.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
