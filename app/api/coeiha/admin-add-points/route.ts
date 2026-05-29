import { NextRequest, NextResponse } from 'next/server';
import { addPointsManually } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { password, username, points } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json({ error: 'admin password not configured' }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'wrong password' }, { status: 401 });
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }
    const pts = parseInt(points, 10);
    if (!pts || pts < 1) {
      return NextResponse.json({ error: 'points must be >= 1' }, { status: 400 });
    }

    const result = await addPointsManually({ username: username.trim(), points: pts });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[/api/admin-add-points] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
