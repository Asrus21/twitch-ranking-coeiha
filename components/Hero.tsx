'use client';

import { useApp } from './AppProvider';

export function Hero() {
  const { t } = useApp();

  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Static gradient blobs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-hotpink-500/30 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-hotpink-500/20 rounded-full blur-[100px]" />

      {/* Floating orbs - sutle ambient movement */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
      </div>

      {/* Dotgrid overlay */}
      <div className="absolute inset-0 dotgrid opacity-50" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Tag - entrance step 1 */}
        <div className="enter-fade enter-d-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-hotpink-500 bg-hotpink-500/10 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-hotpink-500 animate-pulse-pink" />
          <span className="text-xs font-mono uppercase tracking-widest text-hotpink-500 font-bold">
            {t.hero.tag}
          </span>
        </div>

        {/* Headline - entrance step 2 with glow */}
        <h1 className="enter-fade enter-d-1 font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mb-6 headline-glow">
          {t.hero.title.split(' ').map((w, i) => (
            <span
              key={i}
              className={i % 2 === 1 ? 'text-hotpink-500 italic' : ''}
            >
              {w}{' '}
            </span>
          ))}
        </h1>

        {/* Subtitle - entrance step 3 */}
        <p className="enter-fade enter-d-2 max-w-xl text-lg md:text-xl text-[var(--fg-muted)] mb-10 font-light">
          {t.hero.subtitle}
        </p>

        {/* CTA + terminal row - entrance step 4 */}
        <div className="enter-fade enter-d-3 flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
          <a
            href="#ranking"
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-hotpink-500 text-white font-bold uppercase tracking-widest text-sm rounded-full hover:bg-hotpink-600 transition-all hover:scale-105 glow-pink relative overflow-hidden"
          >
            {/* Shine sweep on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">{t.hero.cta}</span>
            <svg
              className="relative transition-transform group-hover:translate-x-1"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>

          {/* Terminal - bigger, with traffic lights for that mac/code feel */}
          <div className="flex-1 max-w-md">
            <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xl overflow-hidden hover:border-hotpink-500/50 transition-colors">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border-b border-[var(--border)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                  chat.twitch.tv
                </span>
              </div>
              {/* Terminal body */}
              <div className="px-5 py-4 font-mono text-base md:text-lg">
                <div className="text-[var(--fg-muted)] text-xs mb-1">
                  &gt; digite no chat:
                </div>
                <div>
                  <span className="text-hotpink-500">$ </span>
                  <span className="text-[var(--fg)]">!ponto</span>
                  <span className="ml-1 inline-block w-2 h-5 bg-hotpink-500 align-middle terminal-cursor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee at bottom - entrance step 5 */}
      <div className="enter-fade enter-d-4 mt-20 overflow-hidden border-y-2 border-hotpink-500 bg-hotpink-500/5 py-4">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex items-center gap-8 pr-8 whitespace-nowrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className="font-display text-3xl tracking-widest text-hotpink-500"
                >
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
