import { NextRequest, NextResponse } from 'next/server';
import { addPointsManually } from '@/lib/db';

export const runtime = 'nodejs';

// Resolve a Twitch avatar from a username via DecAPI (same source the
// StreamElements widget uses). Returns null if it can't be resolved.
async function resolveAvatar(username: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://decapi.me/twitch/avatar/${encodeURIComponent(username)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const url = (await res.text()).trim();
    return url.startsWith('http') ? url : null;
  } catch {
    return null;
  }
}

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

    const avatar = await resolveAvatar(username.trim());
    const result = await addPointsManually({ username: username.trim(), points: pts, avatar });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[/api/admin-add-points] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
