import { NextRequest, NextResponse } from 'next/server';
import { resetRanking } from '@/lib/kv';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: 'admin password not configured on server' },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json({ error: 'wrong password' }, { status: 401 });
    }

    await resetRanking();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/reset] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
