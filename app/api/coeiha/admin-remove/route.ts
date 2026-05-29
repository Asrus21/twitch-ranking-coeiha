import { NextRequest, NextResponse } from 'next/server';
import { removeUser } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { password, username } = await req.json();
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

    const removed = await removeUser(username.trim());
    if (!removed) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/admin-remove] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
