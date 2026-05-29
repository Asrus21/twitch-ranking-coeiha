import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL (or POSTGRES_URL) is not set. Connect Neon in the Vercel Storage tab.'
    );
  }
  _sql = neon(connectionString);
  return _sql;
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
 * Lazy schema setup. Runs CREATE TABLE IF NOT EXISTS on first use of each
 * server instance. Cheap idempotent op — no migration tooling needed.
 */
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
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

export async function addPointsManually(params: {
  username: string;
  points: number;
}): Promise<{ username: string; total: number }> {
  await ensureSchema();
  const username = params.username.toLowerCase().trim();
  const pts = Math.max(1, Math.floor(params.points));

  const rows = (await getSql()`
    INSERT INTO pontos (username, display_name, avatar, points, updated_at)
    VALUES (
      ${username},
      ${params.username.trim()},
      'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png',
      ${pts},
      NOW()
    )
    ON CONFLICT (username) DO UPDATE
      SET points = pontos.points + ${pts},
          updated_at = NOW()
    RETURNING username, points
  `) as { username: string; points: number }[];

  return { username: rows[0].username, total: rows[0].points };
}
