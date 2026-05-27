import { NextResponse } from 'next/server';
import { getRanking, getMeta } from '@/lib/kv';

export const runtime = 'edge';
export const revalidate = 0;

export async function GET() {
  try {
    const [ranking, meta] = await Promise.all([getRanking(100), getMeta()]);
    return NextResponse.json(
      { ranking, meta },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[/api/ranking] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
