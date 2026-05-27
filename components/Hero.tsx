'use client';

import { useApp } from './AppProvider';

export function Hero() {
  const { t } = useApp();

  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* decorative dotgrid bg */}
      <div className="absolute inset-0 dotgrid opacity-50" />
      {/* gradient blob */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-hotpink-500/30 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-hotpink-500/20 rounded-full blur-[100px]" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-hotpink-500 bg-hotpink-500/10 mb-8">
          <span className="w-2 h-2 rounded-full bg-hotpink-500 animate-pulse-pink" />
          <span className="text-xs font-mono uppercase tracking-widest text-hotpink-500 font-bold">
            {t.hero.tag}
          </span>
        </div>

        {/* headline */}
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mb-6">
          {t.hero.title.split(' ').map((w, i) => (
            <span
              key={i}
              className={i % 2 === 1 ? 'text-hotpink-500 italic' : ''}
            >
              {w}{' '}
            </span>
          ))}
        </h1>

        {/* subtitle */}
        <p className="max-w-xl text-lg md:text-xl text-[var(--fg-muted)] mb-10 font-light">
          {t.hero.subtitle}
        </p>

        {/* CTA */}
        <a
          href="#ranking"
          className="inline-flex items-center gap-3 px-8 py-4 bg-hotpink-500 text-white font-bold uppercase tracking-widest text-sm rounded-full hover:bg-hotpink-600 transition-all hover:scale-105 glow-pink"
        >
          {t.hero.cta}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>

        {/* command preview */}
        <div className="mt-16 inline-block">
          <div className="font-mono text-sm text-[var(--fg-muted)] mb-2 uppercase tracking-widest">
            chat.twitch.tv
          </div>
          <div className="px-6 py-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg">
            <span className="font-mono text-hotpink-500">$ </span>
            <span className="font-mono text-[var(--fg)] text-lg">!ponto</span>
            <span className="ml-2 inline-block w-2 h-5 bg-hotpink-500 animate-pulse align-middle" />
          </div>
        </div>
      </div>

      {/* marquee at bottom */}
      <div className="mt-20 overflow-hidden border-y-2 border-hotpink-500 bg-hotpink-500/5 py-4">
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
