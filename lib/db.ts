import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Do NOT cache _sql at module level. Neon's HTTP driver is stateless so
// creating a new function per call is cheap. Caching caused stale connections
// when DATABASE_URL was updated (warm lambda instances kept the old endpoint).
function getSql(): NeonQueryFunction<false, false> {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL (or POSTGRES_URL) is not set. Connect Neon in the Vercel Storage tab.'
    );
  }
  return neon(connectionString);
}

/** Returns "host/dbname" (for diagnostics) without exposing credentials. */
export function getDbHost(): string {
  const cs = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  try {
    const u = new URL(cs);
    return u.host + u.pathname; // e.g. ep-xxx-pooler.neon.tech/neondb
  } catch {
    return cs ? 'unparseable' : 'unset';
  }
}

export type RankingEntry = {
  username: string;
  displayName: string;
  avatar: string;
  points: number;
};

export type Meta = {
  lastReset: string | null;
};

/**
 * Schema setup. Runs CREATE TABLE IF NOT EXISTS on every cold start.
 * Keyed by connection string so a new DATABASE_URL always re-runs setup.
 */
let schemaReadyFor = '';
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  const cs = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (schemaReadyFor !== cs) {
    schemaReady = null;
    schemaReadyFor = cs;
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      await getSql()`
        CREATE TABLE IF NOT EXISTS pontos (
          username     TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          avatar       TEXT NOT NULL,
          points       INTEGER NOT NULL DEFAULT 0,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await getSql()`
        CREATE TABLE IF NOT EXISTS meta (
          key   TEXT PRIMARY KEY,
          value TEXT
        )
      `;
      await getSql()`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await getSql()`CREATE INDEX IF NOT EXISTS pontos_points_idx ON pontos (points DESC)`;
      await getSql()`
        CREATE TABLE IF NOT EXISTS games (
          id          SERIAL PRIMARY KEY,
          title       TEXT NOT NULL,
          image_url   TEXT NOT NULL,
          collection  TEXT NOT NULL CHECK (collection IN ('playing','favorites','finished','played')),
          sort_order  INTEGER NOT NULL DEFAULT 0,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((err) => {
      schemaReady = null; // allow retry on next call if schema setup failed
      throw err;
    });
  }
  return schemaReady;
}

/**
 * Records a !ponto. Returns {recorded:true} if it's the user's first time
 * in the current ranking window, {recorded:false} if they already clocked in.
 */
export async function recordPonto(params: {
  username: string;
  displayName: string;
  avatar: string;
}): Promise<{ recorded: boolean; total: number }> {
  await ensureSchema();
  const username = params.username.toLowerCase();

  // Atomic: insert if missing, do nothing if present. RETURNING tells us
  // which path was taken — if a row comes back, it's a new insert.
  const inserted = (await getSql()`
    INSERT INTO pontos (username, display_name, avatar, points)
    VALUES (${username}, ${params.displayName}, ${params.avatar}, 1)
    ON CONFLICT (username) DO NOTHING
    RETURNING points
  `) as { points: number }[];

  if (inserted.length > 0) {
    return { recorded: true, total: inserted[0].points };
  }

  // Already existed — fetch current total without incrementing
  const existing = (await getSql()`
    SELECT points FROM pontos WHERE username = ${username}
  `) as { points: number }[];

  return { recorded: false, total: existing[0]?.points ?? 0 };
}

export async function getRanking(limit = 100): Promise<RankingEntry[]> {
  await ensureSchema();
  const rows = (await getSql()`
    SELECT username, display_name, avatar, points
    FROM pontos
    ORDER BY points DESC, updated_at ASC
    LIMIT ${limit}
  `) as Array<{
    username: string;
    display_name: string;
    avatar: string;
    points: number;
  }>;

  return rows.map((r) => ({
    username: r.username,
    displayName: r.display_name,
    avatar: r.avatar,
    points: r.points,
  }));
}

export async function resetRanking(): Promise<void> {
  await ensureSchema();
  await getSql()`TRUNCATE TABLE pontos`;
  await getSql()`
    INSERT INTO meta (key, value) VALUES ('last_reset', ${new Date().toISOString()})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export async function getMeta(): Promise<Meta> {
  await ensureSchema();
  const rows = (await getSql()`
    SELECT value FROM meta WHERE key = 'last_reset' LIMIT 1
  `) as { value: string | null }[];
  return { lastReset: rows[0]?.value ?? null };
}

export type AboutSettings = {
  textPt: string | null;
  textEn: string | null;
  imageUrl: string | null;
  imagePosition: string | null; // CSS object-position value like "50% 30%"
  logoUrl: string | null;
  links: string | null; // JSON string of the cards config
};

export async function getAboutSettings(): Promise<AboutSettings> {
  await ensureSchema();
  const rows = (await getSql()`
    SELECT key, value FROM settings
    WHERE key IN ('about_text_pt', 'about_text_en', 'about_image_url', 'about_image_position', 'logo_url', 'about_links')
  `) as Array<{ key: string; value: string }>;

  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    textPt: map.get('about_text_pt') ?? null,
    textEn: map.get('about_text_en') ?? null,
    imageUrl: map.get('about_image_url') ?? null,
    imagePosition: map.get('about_image_position') ?? null,
    logoUrl: map.get('logo_url') ?? null,
    links: map.get('about_links') ?? null,
  };
}

export async function updateAboutSettings(
  patch: Partial<AboutSettings>
): Promise<void> {
  await ensureSchema();
  const entries: Array<[string, string]> = [];
  if (patch.textPt !== undefined && patch.textPt !== null)
    entries.push(['about_text_pt', patch.textPt]);
  if (patch.textEn !== undefined && patch.textEn !== null)
    entries.push(['about_text_en', patch.textEn]);
  if (patch.imageUrl !== undefined && patch.imageUrl !== null)
    entries.push(['about_image_url', patch.imageUrl]);
  if (patch.imagePosition !== undefined && patch.imagePosition !== null)
    entries.push(['about_image_position', patch.imagePosition]);
  if (patch.logoUrl !== undefined && patch.logoUrl !== null)
    entries.push(['logo_url', patch.logoUrl]);
  if (patch.links !== undefined && patch.links !== null)
    entries.push(['about_links', patch.links]);

  for (const [key, value] of entries) {
    await getSql()`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }
}

const DEFAULT_AVATAR =
  'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png';

export async function addPointsManually(params: {
  username: string;
  points: number;
  avatar?: string | null;
}): Promise<{ username: string; total: number }> {
  await ensureSchema();
  const username = params.username.toLowerCase().trim();
  const pts = Math.max(1, Math.floor(params.points));
  const avatar = params.avatar || DEFAULT_AVATAR;

  // When a real avatar was resolved, refresh it on conflict as well — this
  // also fixes older rows that were created with the placeholder.
  const rows = (await getSql()`
    INSERT INTO pontos (username, display_name, avatar, points, updated_at)
    VALUES (${username}, ${params.username.trim()}, ${avatar}, ${pts}, NOW())
    ON CONFLICT (username) DO UPDATE
      SET points = pontos.points + ${pts},
          avatar = CASE
            WHEN ${avatar} <> ${DEFAULT_AVATAR} THEN ${avatar}
            ELSE pontos.avatar
          END,
          updated_at = NOW()
    RETURNING username, points
  `) as { username: string; points: number }[];

  return { username: rows[0].username, total: rows[0].points };
}

export async function removeUser(username: string): Promise<boolean> {
  await ensureSchema();
  const uname = username.toLowerCase().trim();
  const rows = (await getSql()`
    DELETE FROM pontos WHERE username = ${uname} RETURNING username
  `) as { username: string }[];
  return rows.length > 0;
}

export type GameCollection = 'playing' | 'favorites' | 'finished' | 'played';

export type GameEntry = {
  id: number;
  title: string;
  imageUrl: string;
  collection: GameCollection;
  sortOrder: number;
};

export async function getGames(): Promise<GameEntry[]> {
  await ensureSchema();
  const rows = (await getSql()`
    SELECT id, title, image_url, collection, sort_order
    FROM games
    ORDER BY collection, sort_order ASC, created_at ASC
  `) as Array<{ id: number; title: string; image_url: string; collection: string; sort_order: number }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    collection: r.collection as GameCollection,
    sortOrder: r.sort_order,
  }));
}

export async function addGame(params: {
  title: string;
  imageUrl: string;
  collection: GameCollection;
}): Promise<GameEntry> {
  await ensureSchema();
  const rows = (await getSql()`
    INSERT INTO games (title, image_url, collection, sort_order)
    VALUES (${params.title}, ${params.imageUrl}, ${params.collection}, 0)
    RETURNING id, title, image_url, collection, sort_order
  `) as Array<{ id: number; title: string; image_url: string; collection: string; sort_order: number }>;
  const r = rows[0];
  return { id: r.id, title: r.title, imageUrl: r.image_url, collection: r.collection as GameCollection, sortOrder: r.sort_order };
}

export async function removeGame(id: number): Promise<{ removed: boolean; existedBefore: boolean }> {
  await ensureSchema();
  const sql = getSql();
  // SELECT first to confirm the row is visible from this connection
  const before = (await sql`SELECT id FROM games WHERE id = ${id}`) as { id: number }[];
  const deleteRows = (await sql`DELETE FROM games WHERE id = ${id} RETURNING id`) as { id: number }[];
  return { removed: deleteRows.length > 0, existedBefore: before.length > 0 };
}
