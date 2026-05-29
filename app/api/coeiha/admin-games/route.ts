import { NextRequest, NextResponse } from 'next/server';
import { addGame, removeGame, type GameCollection } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_COLLECTIONS: GameCollection[] = ['playing', 'favorites', 'finished', 'played'];

export async function POST(req: NextRequest) {
  try {
    const { password, title, imageUrl, collection } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) return NextResponse.json({ error: 'admin password not configured' }, { status: 500 });
    if (password !== expected) return NextResponse.json({ error: 'wrong password' }, { status: 401 });
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
    if (!imageUrl?.trim()) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    if (!VALID_COLLECTIONS.includes(collection)) return NextResponse.json({ error: 'invalid collection' }, { status: 400 });

    const game = await addGame({ title: title.trim(), imageUrl: imageUrl.trim(), collection });
    return NextResponse.json(game);
  } catch (err) {
    console.error('[/api/coeiha/admin-games POST] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { password, id } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) return NextResponse.json({ error: 'admin password not configured' }, { status: 500 });
    if (password !== expected) return NextResponse.json({ error: 'wrong password' }, { status: 401 });
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (!numId || typeof numId !== 'number' || isNaN(numId)) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const removed = await removeGame(numId);
    if (!removed) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/coeiha/admin-games DELETE] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
