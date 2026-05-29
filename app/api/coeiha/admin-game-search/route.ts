import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export type GameSearchResult = {
  id: number;
  name: string;
  imageUrl: string | null;
};

// SteamGridDB covers all platforms (Steam, Epic, GOG, EA, Ubisoft, Xbox, PS, etc.)
// Set STEAMGRIDDB_API_KEY env var (free at steamgriddb.com) to enable full coverage.
// Without it, falls back to Steam store search (Steam games only).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
  if (sgdbKey) {
    return searchSteamGridDB(q, sgdbKey);
  }
  return searchSteam(q);
}

async function searchSteamGridDB(q: string, apiKey: string): Promise<NextResponse> {
  try {
    // Step 1: search for game IDs
    const searchRes = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
    );
    if (!searchRes.ok) return NextResponse.json([]);

    const searchData = await searchRes.json();
    const games: Array<{ id: number; name: string }> = (searchData.data ?? []).slice(0, 6);
    if (games.length === 0) return NextResponse.json([]);

    // Step 2: fetch a vertical cover for each game (600×900 portrait format)
    const results = await Promise.all(
      games.map(async (g) => {
        try {
          const gridRes = await fetch(
            `https://www.steamgriddb.com/api/v2/grids/game/${g.id}?dimensions=600x900&limit=1`,
            { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
          );
          if (!gridRes.ok) return { id: g.id, name: g.name, imageUrl: null };
          const gridData = await gridRes.json();
          const url: string | null = gridData.data?.[0]?.url ?? null;
          return { id: g.id, name: g.name, imageUrl: url };
        } catch {
          return { id: g.id, name: g.name, imageUrl: null };
        }
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error('[admin-game-search sgdb] error', err);
    return NextResponse.json([]);
  }
}

async function searchSteam(q: string): Promise<NextResponse> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
      { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const items: Array<{ id: number; name: string }> = data.items ?? [];

    const results: GameSearchResult[] = items.slice(0, 8).map((g) => ({
      id: g.id,
      name: g.name,
      imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/library_600x900.jpg`,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error('[admin-game-search steam] error', err);
    return NextResponse.json([]);
  }
}
