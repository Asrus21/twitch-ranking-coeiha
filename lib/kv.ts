import { kv } from '@vercel/kv';

const RANKING_KEY = 'coeiha:ranking';
const META_KEY = 'coeiha:meta';

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
 * Records a !ponto from a user. Returns true if first time in the current
 * ranking window, false if user already clocked in (idempotent).
 */
export async function recordPonto(params: {
  username: string;
  displayName: string;
  avatar: string;
}): Promise<{ recorded: boolean; total: number }> {
  const username = params.username.toLowerCase();
  const memberKey = `user:${username}`;

  // Atomically check + record using a hash for user metadata + sorted set for score
  const existingScore = await kv.zscore(RANKING_KEY, memberKey);

  if (existingScore !== null && existingScore !== undefined) {
    return { recorded: false, total: Number(existingScore) };
  }

  await kv.zadd(RANKING_KEY, { score: 1, member: memberKey });
  await kv.hset(`coeiha:user:${username}`, {
    username,
    displayName: params.displayName,
    avatar: params.avatar,
  });

  return { recorded: true, total: 1 };
}

/**
 * Returns the full ranking sorted by points DESC.
 */
export async function getRanking(limit = 100): Promise<RankingEntry[]> {
  // zrange with REV gets highest scores first
  const members = await kv.zrange(RANKING_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const entries: RankingEntry[] = [];
  for (let i = 0; i < members.length; i += 2) {
    const memberKey = members[i] as string;
    const score = Number(members[i + 1]);
    const username = memberKey.replace(/^user:/, '');

    const userData = (await kv.hgetall(`coeiha:user:${username}`)) as {
      username?: string;
      displayName?: string;
      avatar?: string;
    } | null;

    entries.push({
      username,
      displayName: userData?.displayName || username,
      avatar:
        userData?.avatar ||
        'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png',
      points: score,
    });
  }

  return entries;
}

/**
 * Wipes the ranking and records the reset timestamp.
 */
export async function resetRanking(): Promise<void> {
  // Get all members to clear their user hashes too
  const members = await kv.zrange(RANKING_KEY, 0, -1);
  for (const m of members) {
    const username = (m as string).replace(/^user:/, '');
    await kv.del(`coeiha:user:${username}`);
  }
  await kv.del(RANKING_KEY);
  await kv.hset(META_KEY, { lastReset: new Date().toISOString() });
}

export async function getMeta(): Promise<Meta> {
  const meta = (await kv.hgetall(META_KEY)) as { lastReset?: string } | null;
  return { lastReset: meta?.lastReset || null };
}
