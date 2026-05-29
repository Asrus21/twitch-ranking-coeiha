import { NextRequest, NextResponse } from 'next/server';
import { getGames, getDbHost } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const games = await getGames();
    // ?debug=1 returns DB host + count so we can confirm reads/writes share a DB
    if (req.nextUrl.searchParams.get('debug') === '1') {
      return NextResponse.json(
        { dbHost: getDbHost(), count: games.length, ids: games.map((g) => g.id) },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    return NextResponse.json(games, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('[/api/coeiha/games] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
