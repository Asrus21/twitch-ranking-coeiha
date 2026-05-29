import { NextResponse } from 'next/server';
import { getGames } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await getGames();
    return NextResponse.json(games, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('[/api/coeiha/games] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
