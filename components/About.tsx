'use client';

import { useApp } from './AppProvider';
import { parseCards } from '@/lib/cards';

const DEFAULT_TEXT_PT =
  'Sou streamer há cerca de 5 anos, apaixonada por jogos de todos os tipos e por animes. Amo compartilhar essa paixão nas lives junto com meu chat. 💖';
const DEFAULT_TEXT_EN =
  "I've been streaming for around 5 years — passionate about all kinds of games and anime. I love sharing that passion on stream with my chat. 💖";

const DEFAULT_IMAGE = '/about.jpg';
const DEFAULT_POSITION = '50% 35%';

export function About() {
  const { t, lang, about } = useApp();

  const text =
    lang === 'pt'
      ? about.textPt ?? DEFAULT_TEXT_PT
      : about.textEn ?? DEFAULT_TEXT_EN;
  const imageUrl = about.imageUrl ?? DEFAULT_IMAGE;
  const position = about.imagePosition ?? DEFAULT_POSITION;
  const cards = parseCards(about.links ?? null);

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
        <div className="grid md:grid-cols-12 gap-12 items-center mb-12">
          {/* Photo - circular frame */}
          <div className="md:col-span-5 flex justify-center md:justify-start">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-hotpink-500 via-transparent to-hotpink-500 blur-xl opacity-50" />
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-hotpink-500 glow-pink">
                <img
                  src={imageUrl}
                  alt="streamer"
                  className="w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: position }}
                />
              </div>
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
            <p className="text-lg md:text-xl leading-relaxed text-[var(--fg)] font-light whitespace-pre-wrap">
              {text}
            </p>
          </div>
        </div>

        {/* Link cards - grid of clickable links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <a
              key={i}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] card-hover overflow-hidden"
            >
              {/* Hover sweep */}
              <span className="absolute inset-0 bg-gradient-to-br from-hotpink-500/0 via-hotpink-500/0 to-hotpink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl md:text-3xl text-hotpink-500 break-words">
                    {card.label}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mt-2">
                    {lang === 'pt' ? card.captionPt : card.captionEn}
                  </div>
                </div>
                {/* External arrow icon */}
                <svg
                  className="text-[var(--fg-muted)] group-hover:text-hotpink-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0 ml-2"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
