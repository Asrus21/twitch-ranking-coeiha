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
