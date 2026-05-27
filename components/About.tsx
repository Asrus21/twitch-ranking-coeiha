'use client';

import { useApp } from './AppProvider';

const DEFAULT_TEXT_PT =
  'Sou streamer há cerca de 5 anos, apaixonada por jogos de todos os tipos e por animes. Amo compartilhar essa paixão nas lives junto com meu chat. 💖';
const DEFAULT_TEXT_EN =
  "I've been streaming for around 5 years — passionate about all kinds of games and anime. I love sharing that passion on stream with my chat. 💖";

const DEFAULT_IMAGE = '/about.jpg';
const DEFAULT_POSITION = '50% 35%'; // shows the face nicely on the default image

export function About() {
  const { t, lang, about } = useApp();

  const text =
    lang === 'pt'
      ? about.textPt ?? DEFAULT_TEXT_PT
      : about.textEn ?? DEFAULT_TEXT_EN;
  const imageUrl = about.imageUrl ?? DEFAULT_IMAGE;
  const position = about.imagePosition ?? DEFAULT_POSITION;

  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Title row */}
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-hotpink-500 mb-4">
            ✦ 01
          </div>
          <h2 className="font-display text-6xl md:text-7xl tracking-tight leading-none">
            {t.about.title}
          </h2>
          <div className="mt-6 w-20 h-1 bg-hotpink-500" />
        </div>

        {/* Photo + text grid */}
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Photo - circular frame */}
          <div className="md:col-span-5 flex justify-center md:justify-start">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-hotpink-500 via-transparent to-hotpink-500 blur-xl opacity-50" />
              {/* Frame */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-hotpink-500 glow-pink">
                <img
                  src={imageUrl}
                  alt="streamer"
                  className="w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: position }}
                />
              </div>
              {/* Decorative star */}
              <div className="absolute -top-2 -right-2 text-hotpink-500 font-display text-4xl select-none">
                ✦
              </div>
              <div className="absolute -bottom-2 -left-2 text-hotpink-500 font-display text-3xl select-none">
                ✧
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="md:col-span-7">
            <p className="text-lg md:text-xl leading-relaxed text-[var(--fg)] font-light mb-10 whitespace-pre-wrap">
              {text}
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
