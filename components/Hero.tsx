'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';

const REAL_NICKS = [
  'asrus12', 'DiogoHarada', '1vituvitu', 'AleSZI', 'gxxro',
  'Raxide', 'Coelha', 'lStraif', 'aywnnotina', 'koenez_fsm',
  'felipepugachuu_', 'BoludoDaSilva', 'rowzigrus', 'witzller',
];

const NICK_COLORS = [
  '#FF1493', '#9b59b6', '#3498db', '#e67e22', '#2ecc71',
  '#e74c3c', '#1abc9c', '#f39c12', '#FF66B2', '#00bcd4',
  '#ff5722', '#8bc34a', '#673ab7', '#ff9800',
];

const CHAT_MESSAGES = ['!ponto', '!ponto <3', '!ponto boa noite!!', '!ponto já tô aqui!', '!ponto vlww', '!ponto 🐰'];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MEDALS = ['🥇', '🥈', '🥉'];

type RankEntry = { username: string; displayName: string; points: number; avatar: string };

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!target) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setValue(0);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(p * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function StatCard({ value, label, prefix = '' }: { value: number; label: string; prefix?: string }) {
  const count = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] backdrop-blur-sm">
      <span className="font-display text-3xl text-hotpink-500 leading-none">
        {prefix}{count.toLocaleString('pt-BR')}+
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-bold">{label}</span>
    </div>
  );
}

function ChatLine({ user, color, msg, delay }: { user: string; color: string; msg: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className="flex items-start gap-1.5 text-xs font-mono transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}
    >
      <span style={{ color }} className="font-bold shrink-0">{user}:</span>
      <span className="text-[var(--fg)]">{msg}</span>
    </div>
  );
}

function RankCard({ top3 }: { top3: RankEntry[] }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden shadow-xl hover:border-hotpink-500/50 transition-colors">
      <div className="flex items-center gap-2 px-4 py-2 bg-hotpink-500/10 border-b border-[var(--border)]">
        <span className="w-2 h-2 rounded-full bg-hotpink-500 animate-pulse-pink" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-hotpink-500 font-bold">Top hoje</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        {top3.map((r, i) => (
          <div key={r.username} className="flex items-center gap-2">
            <span className="text-base leading-none">{MEDALS[i]}</span>
            <span className="text-xs font-bold text-[var(--fg)] flex-1">{r.displayName}</span>
            <span className="font-mono text-xs text-hotpink-500 font-bold">{r.points} pts</span>
          </div>
        ))}
        {top3.length === 0 && (
          <p className="text-xs text-[var(--fg-muted)] font-mono">Nenhum ponto ainda hoje</p>
        )}
      </div>
    </div>
  );
}

// Pick 5 random nicks and messages for the chat, stable per render
function buildChatLines() {
  const nicks = shuffled(REAL_NICKS).slice(0, 5);
  return nicks.map((nick, i) => ({
    user: nick,
    color: NICK_COLORS[REAL_NICKS.indexOf(nick) % NICK_COLORS.length],
    msg: CHAT_MESSAGES[i % CHAT_MESSAGES.length],
  }));
}

export function Hero() {
  const { t } = useApp();

  const [chatLines] = useState(buildChatLines);
  const [top3, setTop3] = useState<RankEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [uniqueViewers, setUniqueViewers] = useState(0);
  // Streak badge: rotate through real nicks
  const [streakNick] = useState(() => REAL_NICKS[Math.floor(Math.random() * REAL_NICKS.length)]);

  useEffect(() => {
    fetch('/api/coeiha/ranking')
      .then((r) => r.json())
      .then((data: { ranking: RankEntry[] }) => {
        const ranking = data.ranking ?? [];
        setTop3(ranking.slice(0, 3));
        setTotalPoints(ranking.reduce((s, e) => s + e.points, 0));
        setUniqueViewers(ranking.length);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-0 md:pt-20">
      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-hotpink-500/25 rounded-full blur-[140px]" />
      <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] bg-hotpink-500/15 rounded-full blur-[120px]" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 dotgrid opacity-40" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-80px)] py-16">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col">
            {/* Tag */}
            <div className="enter-fade enter-d-0 inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full border border-hotpink-500 bg-hotpink-500/10 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-hotpink-500 animate-pulse-pink" />
              <span className="text-xs font-mono uppercase tracking-widest text-hotpink-500 font-bold">
                {t.hero.tag}
              </span>
            </div>

            {/* Headline */}
            <h1 className="enter-fade enter-d-1 font-display text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.88] tracking-tight mb-6 headline-glow">
              {t.hero.title.split(' ').map((w, i) => (
                <span key={i} className={i % 2 === 1 ? 'text-hotpink-500 italic' : ''}>
                  {w}{' '}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="enter-fade enter-d-2 max-w-md text-lg text-[var(--fg-muted)] mb-8 font-light leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Stats row */}
            <div className="enter-fade enter-d-2 flex gap-3 mb-10 flex-wrap">
              <StatCard value={totalPoints} label="Pontos batidos" />
              <StatCard value={uniqueViewers} label="Viewers únicos" />
              <StatCard value={top3[0]?.points ?? 0} label="Lives" />
            </div>

            {/* CTAs */}
            <div className="enter-fade enter-d-3 flex flex-wrap gap-4 items-center">
              <a
                href="#ranking"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-hotpink-500 text-white font-bold uppercase tracking-widest text-sm rounded-full hover:bg-hotpink-600 transition-all hover:scale-105 glow-pink relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{t.hero.cta}</span>
                <svg className="relative transition-transform group-hover:translate-x-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-[var(--border)] text-[var(--fg-muted)] text-sm font-bold uppercase tracking-widest hover:border-hotpink-500/60 hover:text-hotpink-500 transition-all"
              >
                Saiba mais
              </a>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="enter-fade enter-d-3 relative flex flex-col gap-4 lg:pl-8">

            {/* Floating badge top-right */}
            <div className="absolute -top-6 -right-4 z-10 hero-float" style={{ animationDelay: '0s' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hotpink-500 text-white shadow-xl glow-pink">
                <span className="text-xl">🏆</span>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-lg">+1 ponto</span>
                  <span className="text-[10px] font-mono opacity-80">BATIDO AGORA</span>
                </div>
              </div>
            </div>

            {/* Terminal — chat ao vivo */}
            <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-2xl overflow-hidden hover:border-hotpink-500/40 transition-colors">
              <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-[var(--border)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-[var(--fg-muted)]">
                  chat.twitch.tv
                </span>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-mono text-[10px] text-green-400">ao vivo</span>
              </div>
              <div className="px-4 py-4 flex flex-col gap-3 min-h-[200px]">
                {chatLines.map((c, i) => (
                  <ChatLine key={c.user} user={c.user} color={c.color} msg={c.msg} delay={400 + i * 600} />
                ))}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-hotpink-500 font-mono text-xs">$</span>
                  <span className="font-mono text-sm text-[var(--fg)] font-bold">!ponto</span>
                  <span className="inline-block w-2 h-4 bg-hotpink-500 align-middle terminal-cursor" />
                </div>
              </div>
            </div>

            {/* Mini ranking */}
            <RankCard top3={top3} />

            {/* Floating badge bottom-left */}
            <div className="absolute -bottom-10 -left-4 z-10 hero-float" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-hotpink-500/60 shadow-xl">
                <span className="text-lg">✦</span>
                <div className="flex flex-col leading-none">
                  <span className="font-mono text-xs text-hotpink-500 font-bold">streak 7 dias</span>
                  <span className="text-[10px] text-[var(--fg-muted)]">{streakNick}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="enter-fade enter-d-4 overflow-hidden border-y-2 border-hotpink-500 bg-hotpink-500/5 py-4">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex items-center gap-8 pr-8 whitespace-nowrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="font-display text-3xl tracking-widest text-hotpink-500">
                  !PONTO · BATIDO · !PONTO · ✦
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
