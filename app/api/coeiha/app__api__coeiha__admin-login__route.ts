import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: 'admin password not configured' },
        { status: 500 }
      );
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'wrong password' }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/coeiha/admin-login] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
