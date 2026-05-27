'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';

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
  } = useApp();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Edit form state — populated when admin opens the panel
  const [textPt, setTextPt] = useState('');
  const [textEn, setTextEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosX, setImagePosX] = useState(50);
  const [imagePosY, setImagePosY] = useState(35);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open via header button
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('coeiha:open-admin', handler);
    return () => window.removeEventListener('coeiha:open-admin', handler);
  }, []);

  // When opening as admin (already logged in), seed the form with current data
  useEffect(() => {
    if (!open || !isAdmin) return;
    setTextPt(about.textPt ?? '');
    setTextEn(about.textEn ?? '');
    setImageUrl(about.imageUrl ?? '');
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

  // Compress + read file as base64 data URL
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const compressed = await compressImage(dataUrl, 800, 0.85);
        const bytes = Math.floor((compressed.length * 3) / 4);
        if (bytes > MAX_IMAGE_BYTES) {
          setError(t.admin.imageTooLarge);
          return;
        }
        setImageUrl(compressed);
      } catch (err) {
        console.error('[compress]', err);
        setError(t.admin.imageError);
      }
    };
    reader.readAsDataURL(file);
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
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6 flex items-center justify-between">
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
            // ===== LOGIN =====
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
            // ===== AUTHENTICATED PANEL =====
            <div className="space-y-8">
              {/* IMAGE SECTION */}
              <section>
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <span className="text-hotpink-500">✦</span> {t.admin.photoTitle}
                </h4>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Preview */}
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
                        <div className="w-full h-full flex items-center justify-center text-[var(--fg-muted)] font-mono text-xs">
                          {t.admin.noImage}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex-1 w-full space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
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
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={imagePosX}
                        onChange={(e) => setImagePosX(parseInt(e.target.value, 10))}
                        className="w-full accent-hotpink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                        {t.admin.posY}: {imagePosY}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={imagePosY}
                        onChange={(e) => setImagePosY(parseInt(e.target.value, 10))}
                        className="w-full accent-hotpink-500"
                      />
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
                    <textarea
                      value={textPt}
                      onChange={(e) => setTextPt(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none resize-y"
                      placeholder={t.admin.textPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                      {t.admin.textEn}
                    </label>
                    <textarea
                      value={textEn}
                      onChange={(e) => setTextEn(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus:border-hotpink-500 focus:outline-none resize-y"
                      placeholder={t.admin.textPlaceholder}
                    />
                  </div>
                </div>
              </section>

              {/* RESET SECTION - reveals only after confirmation */}
              <section className="pt-6 border-t border-[var(--border)]">
                <h4 className="font-display text-2xl mb-4 flex items-center gap-2 text-red-500">
                  <span>⚠</span> {t.admin.dangerZone}
                </h4>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2.5 rounded-full border border-red-500 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    {t.admin.showReset}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--fg-muted)]">
                      {t.ranking.confirm}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2.5 rounded-full border border-[var(--border)] font-bold uppercase text-xs tracking-widest hover:bg-[var(--bg)]"
                      >
                        {t.ranking.cancel}
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={busy}
                        className="px-4 py-2.5 rounded-full bg-red-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-red-600 disabled:opacity-50"
                      >
                        {busy ? '...' : 'Reset'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Status messages */}
              {error && (
                <div className="text-sm font-mono text-red-500">{error}</div>
              )}
              {msg && (
                <div className="text-sm font-mono text-green-500">{msg}</div>
              )}

              {/* Action footer */}
              <div className="sticky bottom-0 bg-[var(--bg-secondary)] pt-4 pb-2 -mx-6 px-6 border-t border-[var(--border)] flex gap-3">
                <button
                  onClick={() => {
                    adminLogout();
                    close();
                  }}
                  className="px-4 py-3 rounded-full border border-[var(--border)] font-bold uppercase text-xs tracking-widest hover:bg-[var(--bg)]"
                >
                  {t.admin.logout}
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="flex-1 px-4 py-3 rounded-full bg-hotpink-500 text-white font-bold uppercase text-xs tracking-widest hover:bg-hotpink-600 disabled:opacity-50"
                >
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

/**
 * Compress an image data URL to a max width, returning a JPEG data URL.
 * This keeps the payload under the 2MB limit even for high-res phone photos.
 */
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
