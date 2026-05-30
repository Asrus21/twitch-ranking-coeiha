'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';
import { parseCards, type AboutCard } from '@/lib/cards';
import type { GameCollection } from '@/lib/db';

type GameSearchResult = { id: number; name: string; imageUrl: string | null };

const GAME_COLLECTIONS: { key: GameCollection; labelPt: string; labelEn: string }[] = [
  { key: 'playing',   labelPt: 'Jogando agora',  labelEn: 'Playing now' },
  { key: 'favorites', labelPt: 'Favoritos',       labelEn: 'Favourites' },
  { key: 'finished',  labelPt: 'Zerados em live', labelEn: 'Finished on stream' },
  { key: 'played',    labelPt: 'Jogados',          labelEn: 'Played' },
];

const MAX_IMAGE_BYTES = 2_000_000;

export function AdminPanel() {
  const {
    t,
    lang,
    isAdmin,
    adminPassword,
    adminLogin,
    adminLogout,
    about,
    refreshAbout,
    games,
    refreshGames,
    addGameToList,
    removeGameFromList,
    applyGames,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Edit form state
  const [textPt, setTextPt] = useState('');
  const [textEn, setTextEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosX, setImagePosX] = useState(50);
  const [imagePosY, setImagePosY] = useState(35);
  const [logoUrl, setLogoUrl] = useState('');
  const [cards, setCards] = useState<AboutCard[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Manual points
  const [addUser, setAddUser] = useState('');
  const [addPts, setAddPts] = useState(1);
  const [addBusy, setAddBusy] = useState(false);

  // Remove nick
  const [removeName, setRemoveName] = useState('');
  const [removeBusy, setRemoveBusy] = useState(false);

  // Games management
  const [gameQuery, setGameQuery] = useState('');
  const [gameResults, setGameResults] = useState<GameSearchResult[]>([]);
  const [gameSearching, setGameSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [gameCollection, setGameCollection] = useState<GameCollection>('playing');
  const [gameBusy, setGameBusy] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('coeiha:open-admin', handler);
    return () => window.removeEventListener('coeiha:open-admin', handler);
  }, []);

  useEffect(() => {
    if (!open || !isAdmin) return;
    setTextPt(about.textPt ?? '');
    setTextEn(about.textEn ?? '');
    setImageUrl(about.imageUrl ?? '');
    setLogoUrl(about.logoUrl ?? '');
    setCards(parseCards(about.links ?? null));
    const pos = about.imagePosition ?? '50% 35%';
    const [x, y] = pos.replace(/%/g, '').split(' ').map((n) => parseInt(n, 10));
    if (!isNaN(x)) setImagePosX(x);
    if (!isNaN(y)) setImagePosY(y);
    setError(null);
    setMsg(null);
    setShowResetConfirm(false);
  }, [open, isAdmin, about]);

  const close = useCallback(() => {
    setOpen(false);
    setPassword('');
    setError(null);
    setMsg(null);
    setShowResetConfirm(false);
  }, []);

  const handleLogin = async () => {
    if (!password) return;
    setBusy(true);
    setError(null);
    const ok = await adminLogin(password);
    setBusy(false);
    if (!ok) setError(t.admin.wrongPassword);
    else setPassword('');
  };

  // Generic image-select handler. `which` decides which state to update,
  // and the max width differs (logo is small, photo is bigger).
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    which: 'photo' | 'logo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const maxW = which === 'logo' ? 256 : 800;
        const compressed = await compressImage(dataUrl, maxW, 0.85);
        const bytes = Math.floor((compressed.length * 3) / 4);
        if (bytes > MAX_IMAGE_BYTES) {
          setError(t.admin.imageTooLarge);
          return;
        }
        if (which === 'logo') setLogoUrl(compressed);
        else setImageUrl(compressed);
      } catch (err) {
        console.error('[compress]', err);
        setError(t.admin.imageError);
      }
    };
    reader.readAsDataURL(file);
  };

  // Card editing helpers
  const updateCard = (index: number, patch: Partial<AboutCard>) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };
  const addCard = () => {
    setCards((prev) => [
      ...prev,
      { label: 'novo', captionPt: 'Link', captionEn: 'Link', url: 'https://' },
    ]);
  };
  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };
  const moveCard = (index: number, dir: -1 | 1) => {
    setCards((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch('/api/coeiha/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify({
          textPt: textPt || null,
          textEn: textEn || null,
          imageUrl: imageUrl || null,
          imagePosition: `${imagePosX}% ${imagePosY}%`,
          logoUrl: logoUrl || null,
          links: JSON.stringify(cards),
        }),
      });
      if (res.ok) {
        setMsg(t.admin.saved);
        await refreshAbout();
        setTimeout(() => setMsg(null), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.admin.saveError);
      }
    } catch {
      setError(t.admin.saveError);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!adminPassword) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch('/api/coeiha/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setMsg(t.admin.resetSuccess);
        setShowResetConfirm(false);
        window.dispatchEvent(new CustomEvent('coeiha:refresh-ranking'));
        setTimeout(() => setMsg(null), 2000);
      } else {
        setError(t.admin.resetError);
      }
    } catch {
      setError(t.admin.resetError);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-2xl border border-hotpink-500 max-w-2xl w-full glow-pink max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6 flex items-center justify-between z-10">
          <h3 className="font-display text-3xl">{t.admin.title}</h3>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-hotpink-500 hover:text-white hover:border-hotpink-500 transition-all"
            aria-label="close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!isAdmin ? (
            <div>
              <p className="text-sm text-[var(--fg-muted)] mb-6">
                {t.admin.loginHint}
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.ranking.password}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
              {error && (
                <div className="mt-4 text-sm font-mono text-red-500">{error}</div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={close}
                  className="flex-1 px-4 py-3 rounded-full border border-[var(--border)] font-bold uppercase text-xs tracking-widest hover:bg-[var(--bg)]"
                >
                  {t.ranking.cancel}
                </button>
                <button
                  onClick={handleLogin}
                  disabled={busy || !password}
                  className="flex-1 px-4 py-3 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50"
                >
                  {busy ? '...' : t.admin.login}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* LOGO SECTION */}
              <section>
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.logoTitle}
                </h4>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-hotpink-500 glow-pink bg-[var(--bg)] flex-shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'logo')}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-full border border-hotpink-500 text-hotpink-500 font-bold uppercase text-xs tracking-widest hover:bg-hotpink-500 hover:text-white transition-all"
                  >
                    {t.admin.uploadLogo}
                  </button>
                </div>
              </section>

              {/* PHOTO SECTION */}
              <section>
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.photoTitle}
                </h4>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative flex-shrink-0">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-hotpink-500 glow-pink bg-[var(--bg)]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="preview"
                          className="w-full h-full"
                          style={{
                            objectFit: 'cover',
                            objectPosition: `${imagePosX}% ${imagePosY}%`,
                          }}
                        />
                      ) : (
                        <img
                          src="/about.jpg"
                          alt="preview"
                          className="w-full h-full"
                          style={{
                            objectFit: 'cover',
                            objectPosition: `${imagePosX}% ${imagePosY}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'photo')}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2.5 rounded-full border border-hotpink-500 text-hotpink-500 font-bold uppercase text-xs tracking-widest hover:bg-hotpink-500 hover:text-white transition-all"
                    >
                      {t.admin.uploadPhoto}
                    </button>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                        {t.admin.posX}: {imagePosX}%
                      </label>
                      <input type="range" min={0} max={100} value={imagePosX}
                        onChange={(e) => setImagePosX(parseInt(e.target.value, 10))}
                        className="w-full accent-hotpink-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                        {t.admin.posY}: {imagePosY}%
                      </label>
                      <input type="range" min={0} max={100} value={imagePosY}
                        onChange={(e) => setImagePosY(parseInt(e.target.value, 10))}
                        className="w-full accent-hotpink-500" />
                    </div>
                  </div>
                </div>
              </section>

              {/* TEXT SECTION */}
              <section>
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.textTitle}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.textPt}
                    </label>
                    <textarea value={textPt} onChange={(e) => setTextPt(e.target.value)} rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none resize-y"
                      placeholder={t.admin.textPlaceholder} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.textEn}
                    </label>
                    <textarea value={textEn} onChange={(e) => setTextEn(e.target.value)} rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none resize-y"
                      placeholder={t.admin.textPlaceholder} />
                  </div>
                </div>
              </section>

              {/* CARDS / LINKS SECTION */}
              <section>
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.linksTitle}
                </h4>
                <div className="space-y-4">
                  {cards.map((card, i) => (
                    <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">
                          #{i + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveCard(i, -1)} disabled={i === 0}
                            className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30 hover:bg-hotpink-500 hover:text-white transition-all"
                            aria-label="move up">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                          </button>
                          <button onClick={() => moveCard(i, 1)} disabled={i === cards.length - 1}
                            className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30 hover:bg-hotpink-500 hover:text-white transition-all"
                            aria-label="move down">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                          <button onClick={() => removeCard(i)}
                            className="w-7 h-7 rounded-full border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            aria-label="remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">{t.admin.cardLabel}</label>
                          <input value={card.label} onChange={(e) => updateCard(i, { label: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">{t.admin.cardCaptionPt}</label>
                          <input value={card.captionPt} onChange={(e) => updateCard(i, { captionPt: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">{t.admin.cardCaptionEn}</label>
                          <input value={card.captionEn} onChange={(e) => updateCard(i, { captionEn: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">{t.admin.cardUrl}</label>
                          <input value={card.url} onChange={(e) => updateCard(i, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none text-sm font-mono" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addCard}
                    className="w-full px-4 py-2.5 rounded-full border border-dashed border-hotpink-500 text-hotpink-500 font-bold uppercase text-xs tracking-widest hover:bg-hotpink-500 hover:text-white transition-all">
                    + {t.admin.addCard}
                  </button>
                </div>
              </section>

              {/* GAMES SECTION */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {lang === 'pt' ? 'Jogos' : 'Games'}
                </h4>

                {/* Search */}
                <div className="space-y-3 mb-6">
                  <p className="text-[11px] text-[var(--fg-muted)] font-mono leading-relaxed">
                    {lang === 'pt'
                      ? 'Busca jogos da Steam automaticamente. Para Riot, EA, Epic, Ubisoft, etc., adicione STEAMGRIDDB_API_KEY nas env vars (grátis em steamgriddb.com) — ou cole a URL da imagem manualmente.'
                      : 'Auto-searches Steam. For Riot, EA, Epic, Ubisoft, etc., add STEAMGRIDDB_API_KEY to env vars (free at steamgriddb.com) — or paste an image URL manually.'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gameQuery}
                      onChange={(e) => setGameQuery(e.target.value)}
                      placeholder={lang === 'pt' ? 'Buscar jogo...' : 'Search game...'}
                      className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setGameSearching(true);
                          setGameResults([]);
                          setSelectedGame(null);
                          fetch(`/api/coeiha/admin-game-search?q=${encodeURIComponent(gameQuery)}`)
                            .then((r) => r.json())
                            .then(setGameResults)
                            .catch(console.error)
                            .finally(() => setGameSearching(false));
                        }
                      }}
                    />
                    <button
                      disabled={gameSearching || !gameQuery.trim()}
                      onClick={() => {
                        setGameSearching(true);
                        setGameResults([]);
                        setSelectedGame(null);
                        fetch(`/api/coeiha/admin-game-search?q=${encodeURIComponent(gameQuery)}`)
                          .then((r) => r.json())
                          .then(setGameResults)
                          .catch(console.error)
                          .finally(() => setGameSearching(false));
                      }}
                      className="px-4 py-3 rounded-lg bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50 transition-all"
                    >
                      {gameSearching ? '...' : '🔍'}
                    </button>
                  </div>

                  {/* Search results */}
                  {gameResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {gameResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedGame(r); setGameResults([]); setGameQuery(r.name); setManualImageUrl(''); }}
                          className={`relative rounded-lg overflow-hidden border-2 aspect-[3/4] transition-all ${selectedGame?.id === r.id ? 'border-hotpink-500' : 'border-transparent hover:border-hotpink-500/60'}`}
                        >
                          {r.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] text-xs p-1 text-center">{r.name}</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                            <p className="text-white text-[9px] font-bold line-clamp-2 leading-tight">{r.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected game preview or manual URL */}
                  {selectedGame && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-hotpink-500/40 bg-hotpink-500/5">
                      {selectedGame.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedGame.imageUrl} alt={selectedGame.name} className="w-10 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{selectedGame.name}</p>
                        <p className="text-xs text-hotpink-500">✓ {lang === 'pt' ? 'selecionado' : 'selected'}</p>
                      </div>
                      <button onClick={() => { setSelectedGame(null); setGameQuery(''); }} className="text-[var(--fg-muted)] hover:text-red-500 text-xs">✕</button>
                    </div>
                  )}

                  {/* Manual URL fallback */}
                  {!selectedGame && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-1">
                        {lang === 'pt' ? 'Ou cole a URL da imagem' : 'Or paste image URL'}
                      </label>
                      <input
                        type="url"
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                  )}

                  {/* Collection picker */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {lang === 'pt' ? 'Coleção' : 'Collection'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GAME_COLLECTIONS.map((col) => (
                        <button
                          key={col.key}
                          onClick={() => setGameCollection(col.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                            gameCollection === col.key
                              ? 'bg-hotpink-500 border-hotpink-500 text-white'
                              : 'border-[var(--border)] text-[var(--fg-muted)] hover:border-hotpink-500 hover:text-hotpink-500'
                          }`}
                        >
                          {lang === 'pt' ? col.labelPt : col.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={gameBusy || (!selectedGame && !manualImageUrl.trim())}
                    onClick={async () => {
                      if (!adminPassword) return;
                      const title = selectedGame?.name || gameQuery.trim() || 'Unknown';
                      const imageUrl = selectedGame?.imageUrl || manualImageUrl.trim();
                      if (!imageUrl) return;
                      setGameBusy(true);
                      setError(null);
                      try {
                        const res = await fetch('/api/coeiha/admin-games', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: adminPassword, title, imageUrl, collection: gameCollection }),
                        });
                        if (res.ok) {
                          const newGame = await res.json();
                          addGameToList(newGame); // instant UI update
                          setSelectedGame(null);
                          setManualImageUrl('');
                          setGameQuery('');
                          setGameResults([]);
                          setMsg(lang === 'pt' ? 'Jogo adicionado!' : 'Game added!');
                          setTimeout(() => setMsg(null), 2000);
                        } else {
                          setError(lang === 'pt' ? 'Erro ao adicionar jogo' : 'Failed to add game');
                        }
                      } catch {
                        setError(lang === 'pt' ? 'Erro ao adicionar jogo' : 'Failed to add game');
                      } finally {
                        setGameBusy(false);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50 transition-all"
                  >
                    {gameBusy ? '...' : (lang === 'pt' ? '+ Adicionar jogo' : '+ Add game')}
                  </button>
                </div>

                {/* Games list grouped by collection */}
                {games.length > 0 && (
                  <div className="space-y-4">
                    {GAME_COLLECTIONS.map((col) => {
                      const colGames = games.filter((g) => g.collection === col.key);
                      if (colGames.length === 0) return null;
                      return (
                        <div key={col.key}>
                          <p className="text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                            {lang === 'pt' ? col.labelPt : col.labelEn}
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {colGames.map((game) => (
                              <div key={game.id} className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                                {/* Cover — fixed aspect ratio */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={game.imageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                </div>
                                {/* Remove button — always outside and below the image */}
                                <button
                                  disabled={removingId === game.id}
                                  onClick={async () => {
                                    if (!adminPassword) return;
                                    setRemovingId(game.id);
                                    setRemoveError(null);
                                    try {
                                      const res = await fetch('/api/coeiha/admin-games', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ password: adminPassword, id: Number(game.id) }),
                                      });
                                      const data = await res.json().catch(() => ({}));
                                      if ((res.ok || res.status === 404) && Array.isArray(data.games)) {
                                        // Use the authoritative list from DB — no more optimistic guessing
                                        applyGames(data.games);
                                      } else if (!res.ok) {
                                        setRemoveError(`Erro ${res.status}: ${data.error ?? 'falhou'}`);
                                      }
                                    } catch (e) {
                                      setRemoveError('Erro de rede');
                                    } finally {
                                      setRemovingId(null);
                                    }
                                  }}
                                  className="w-full py-2 bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 disabled:opacity-60 transition-all"
                                  title={game.title}
                                >
                                  {removingId === game.id ? '...' : (lang === 'pt' ? 'Remover' : 'Remove')}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {removeError && (
                  <p className="mt-3 text-xs font-mono text-red-400">{removeError}</p>
                )}
              </section>

              {/* ADD POINTS MANUALLY */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.addPointsTitle}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.addPointsUser}
                    </label>
                    <input
                      type="text"
                      value={addUser}
                      onChange={(e) => setAddUser(e.target.value)}
                      placeholder="ex: asrus12"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.addPointsPts}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={addPts}
                      onChange={(e) => setAddPts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    disabled={addBusy || !addUser.trim()}
                    onClick={async () => {
                      if (!adminPassword || !addUser.trim()) return;
                      setAddBusy(true);
                      setError(null);
                      setMsg(null);
                      try {
                        const res = await fetch('/api/coeiha/admin-add-points', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: adminPassword, username: addUser.trim(), points: addPts }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setMsg(`${t.admin.addPointsSuccess} ${data.username} → ${data.total} pts`);
                          setAddUser('');
                          setAddPts(1);
                          window.dispatchEvent(new CustomEvent('coeiha:refresh-ranking'));
                          setTimeout(() => setMsg(null), 3000);
                        } else {
                          const data = await res.json().catch(() => ({}));
                          setError(data.error || t.admin.addPointsError);
                        }
                      } catch {
                        setError(t.admin.addPointsError);
                      } finally {
                        setAddBusy(false);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50 transition-all"
                  >
                    {addBusy ? '...' : t.admin.addPointsBtn}
                  </button>
                </div>
              </section>

              {/* REMOVE POINTS */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {lang === 'pt' ? 'Remover pontos' : 'Remove points'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.addPointsUser}
                    </label>
                    <input
                      type="text"
                      value={addUser}
                      onChange={(e) => setAddUser(e.target.value)}
                      placeholder="ex: asrus12"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {lang === 'pt' ? 'Pontos a remover' : 'Points to remove'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={addPts}
                      onChange={(e) => setAddPts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    disabled={addBusy || !addUser.trim()}
                    onClick={async () => {
                      if (!adminPassword || !addUser.trim()) return;
                      setAddBusy(true);
                      setError(null);
                      setMsg(null);
                      try {
                        const res = await fetch('/api/coeiha/admin-add-points', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: adminPassword, username: addUser.trim(), points: -addPts }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setMsg(`${lang === 'pt' ? 'Removido' : 'Removed'}: ${data.username} → ${data.total} pts`);
                          setAddUser('');
                          setAddPts(1);
                          window.dispatchEvent(new CustomEvent('coeiha:refresh-ranking'));
                          setTimeout(() => setMsg(null), 3000);
                        } else {
                          const data = await res.json().catch(() => ({}));
                          setError(data.error || (lang === 'pt' ? 'Erro ao remover pontos' : 'Failed to remove points'));
                        }
                      } catch {
                        setError(lang === 'pt' ? 'Erro ao remover pontos' : 'Failed to remove points');
                      } finally {
                        setAddBusy(false);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-full border border-red-500 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all"
                  >
                    {addBusy ? '...' : (lang === 'pt' ? '− Remover pontos' : '− Remove points')}
                  </button>
                </div>
              </section>

              {/* REMOVE NICK */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.removeTitle}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.removeUser}
                    </label>
                    <input
                      type="text"
                      value={removeName}
                      onChange={(e) => setRemoveName(e.target.value)}
                      placeholder="ex: asrus12"
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    disabled={removeBusy || !removeName.trim()}
                    onClick={async () => {
                      if (!adminPassword || !removeName.trim()) return;
                      setRemoveBusy(true);
                      setError(null);
                      setMsg(null);
                      try {
                        const res = await fetch('/api/coeiha/admin-remove', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: adminPassword, username: removeName.trim() }),
                        });
                        if (res.ok) {
                          setMsg(`${t.admin.removeSuccess}: ${removeName.trim()}`);
                          setRemoveName('');
                          window.dispatchEvent(new CustomEvent('coeiha:refresh-ranking'));
                          setTimeout(() => setMsg(null), 3000);
                        } else if (res.status === 404) {
                          setError(t.admin.removeNotFound);
                        } else {
                          const data = await res.json().catch(() => ({}));
                          setError(data.error || t.admin.removeError);
                        }
                      } catch {
                        setError(t.admin.removeError);
                      } finally {
                        setRemoveBusy(false);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-full border border-red-500 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all"
                  >
                    {removeBusy ? '...' : t.admin.removeBtn}
                  </button>
                </div>
              </section>

              {/* DANGER ZONE */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2 text-red-500">
                  <span>⚠</span> {t.admin.dangerZone}
                </h4>
                {!showResetConfirm ? (
                  <button onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2.5 rounded-full border border-red-500 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    {t.admin.showReset}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--fg-muted)]">{t.ranking.confirm}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2.5 rounded-full border border-[var(--border)] font-bold uppercase text-xs tracking-widest hover:bg-[var(--bg)]">
                        {t.ranking.cancel}
                      </button>
                      <button onClick={handleReset} disabled={busy}
                        className="px-4 py-2.5 rounded-full bg-red-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-red-600 disabled:opacity-50">
                        {busy ? '...' : 'Reset'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {error && <div className="text-sm font-mono text-red-500">{error}</div>}
              {msg && <div className="text-sm font-mono text-green-500">{msg}</div>}

              <div className="sticky bottom-0 bg-[var(--bg-secondary)] pt-4 pb-2 -mx-6 px-6 border-t border-[var(--border)] flex gap-3">
                <button onClick={() => { adminLogout(); close(); }}
                  className="px-4 py-3 rounded-full border border-[var(--border)] font-bold uppercase text-xs tracking-widest hover:bg-[var(--bg)]">
                  {t.admin.logout}
                </button>
                <button onClick={handleSave} disabled={busy}
                  className="flex-1 px-4 py-3 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50">
                  {busy ? '...' : t.admin.save}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function compressImage(
  dataUrl: string,
  maxWidth: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas ctx'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = dataUrl;
  });
}
