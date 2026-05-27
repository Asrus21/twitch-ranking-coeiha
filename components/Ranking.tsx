'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppProvider';

type RankingEntry = {
  username: string;
  displayName: string;
  avatar: string;
  points: number;
};

type RankingData = {
  ranking: RankingEntry[];
  meta: { lastReset: string | null };
};

export function Ranking() {
  const { t, lang } = useApp();
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/coeiha/ranking', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  // Allow other components (like the admin panel after a reset) to trigger
  // a refresh without prop drilling.
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('coeiha:refresh-ranking', handler);
    return () => window.removeEventListener('coeiha:refresh-ranking', handler);
  }, [load]);

  const formatReset = (iso: string | null) => {
    if (!iso) return t.ranking.never;
    const d = new Date(iso);
    return d.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ranking = data?.ranking || [];
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <section id="ranking" className="relative py-24 md:py-32 stripes">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-hotpink-500 mb-4">
              ✦ 02
            </div>
            <h2 className="font-display text-6xl md:text-7xl tracking-tight leading-none">
              {t.ranking.title}
            </h2>
            <p className="text-lg text-[var(--fg-muted)] mt-3">{t.ranking.subtitle}</p>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)]">
            {t.ranking.lastReset}: {formatReset(data?.meta.lastReset || null)}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--fg-muted)] font-mono uppercase tracking-widest">
            {t.ranking.loading}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✦</div>
            <p className="text-xl text-[var(--fg-muted)]">{t.ranking.empty}</p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {podium.map((entry, idx) => (
                  <PodiumCard
                    key={entry.username}
                    entry={entry}
                    place={idx + 1}
                    pointsLabel={
                      entry.points === 1 ? t.ranking.point : t.ranking.points
                    }
                  />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-3 border-b border-[var(--border)] text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)]">
                  <div className="col-span-2">#</div>
                  <div className="col-span-7">{t.ranking.user}</div>
                  <div className="col-span-3 text-right">{t.ranking.total}</div>
                </div>
                {rest.map((entry, idx) => (
                  <div
                    key={entry.username}
                    className="grid grid-cols-12 px-6 py-3 items-center border-b border-[var(--border)] last:border-0 hover:bg-hotpink-500/5 transition-colors"
                  >
                    <div className="col-span-2 font-display text-xl text-hotpink-500">
                      {String(idx + 4).padStart(2, '0')}
                    </div>
                    <div className="col-span-7 flex items-center gap-3 min-w-0">
                      <img
                        src={entry.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-hotpink-500/40 flex-shrink-0"
                      />
                      <span className="font-medium truncate">
                        {entry.displayName}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold text-hotpink-500">
                      {entry.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PodiumCard({
  entry,
  place,
  pointsLabel,
}: {
  entry: RankingEntry;
  place: number;
  pointsLabel: string;
}) {
  const sizes = {
    1: 'sm:order-2 sm:scale-110 sm:-mt-4',
    2: 'sm:order-1',
    3: 'sm:order-3',
  } as const;
  const medals = { 1: '★', 2: '✦', 3: '✧' } as const;

  return (
    <div
      className={`${
        sizes[place as 1 | 2 | 3]
      } relative rounded-2xl border-2 border-hotpink-500 bg-[var(--bg-secondary)] p-6 text-center card-hover overflow-hidden`}
    >
      {place === 1 && (
        <div className="absolute inset-0 bg-gradient-to-br from-hotpink-500/20 via-transparent to-hotpink-500/20 pointer-events-none" />
      )}
      <div className="relative">
        <div className="font-display text-7xl text-hotpink-500 leading-none mb-2">
          {medals[place as 1 | 2 | 3]}
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-4">
          #{place}
        </div>
        <img
          src={entry.avatar}
          alt=""
          className="w-20 h-20 rounded-full mx-auto border-2 border-hotpink-500 object-cover mb-3"
        />
        <div className="font-display text-2xl truncate">{entry.displayName}</div>
        <div className="mt-2">
          <span className="font-mono font-bold text-hotpink-500 text-3xl">
            {entry.points}
          </span>
          <span className="ml-2 text-xs uppercase tracking-widest text-[var(--fg-muted)]">
            {pointsLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
