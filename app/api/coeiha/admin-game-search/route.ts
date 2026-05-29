import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export type GameSearchResult = {
  id: number;
  name: string;
  imageUrl: string | null;
};

// Steam store search — no API key required.
// Cover image uses the vertical library format (600×900) which fits our 3:4 grid.
// Falls back to the horizontal header if the vertical isn't available.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const items: Array<{ id: number; name: string }> = data.items ?? [];

    const results: GameSearchResult[] = items.slice(0, 8).map((g) => ({
      id: g.id,
      name: g.name,
      // library_600x900 is the vertical box art — matches our 3:4 grid perfectly
      imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/library_600x900.jpg`,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error('[/api/coeiha/admin-game-search] error', err);
    return NextResponse.json([]);
  }
}
