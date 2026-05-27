'use client';

import { useApp } from './AppProvider';

export function About() {
  const { t } = useApp();

  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Left: large title */}
          <div className="md:col-span-5">
            <div className="font-mono text-xs uppercase tracking-widest text-hotpink-500 mb-4">
              ✦ 01
            </div>
            <h2 className="font-display text-6xl md:text-7xl tracking-tight leading-none">
              {t.about.title}
            </h2>
            <div className="mt-6 w-20 h-1 bg-hotpink-500" />
          </div>

          {/* Right: text + stats */}
          <div className="md:col-span-7">
            <p className="text-lg md:text-xl leading-relaxed text-[var(--fg)] font-light mb-10">
              {t.about.placeholder}
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] card-hover">
                <div className="font-display text-3xl text-hotpink-500">!ponto</div>
                <div className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mt-2">
                  {t.about.stats.commands}
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] card-hover">
                <div className="font-display text-3xl text-hotpink-500">Twitch</div>
                <div className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mt-2">
                  {t.about.stats.live}
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] card-hover">
                <div className="font-display text-3xl text-hotpink-500">✿</div>
                <div className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mt-2">
                  {t.about.stats.community}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
