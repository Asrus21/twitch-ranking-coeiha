import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export type GameSearchResult = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    // No API key configured — return empty so admin falls back to manual URL input
    return NextResponse.json([]);
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(q)}&page_size=8&ordering=-rating`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const results: GameSearchResult[] = (data.results ?? []).map((g: { id: number; name: string; background_image?: string }) => ({
      id: g.id,
      name: g.name,
      imageUrl: g.background_image ?? null,
    }));
    return NextResponse.json(results);
  } catch (err) {
    console.error('[/api/coeiha/admin-game-search] error', err);
    return NextResponse.json([]);
  }
}
