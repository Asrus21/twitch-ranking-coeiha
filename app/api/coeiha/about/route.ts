import { NextRequest, NextResponse } from 'next/server';
import { getAboutSettings, updateAboutSettings } from '@/lib/db';

export const runtime = 'nodejs';
export const revalidate = 0;

// Cap image payload to ~2MB after base64 (~1.5MB raw). Bigger than this and
// we'd really want object storage instead of inlining in Postgres.
const MAX_IMAGE_BYTES = 2_000_000;

export async function GET() {
  try {
    const settings = await getAboutSettings();
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('[/api/coeiha/about GET] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminPass = req.headers.get('x-admin-password');
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: 'admin password not configured' },
        { status: 500 }
      );
    }
    if (adminPass !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { textPt, textEn, imageUrl, imagePosition, logoUrl, links } = body as {
      textPt?: string;
      textEn?: string;
      imageUrl?: string;
      imagePosition?: string;
      logoUrl?: string;
      links?: string;
    };

    // Validate image size if it's a data URL
    if (imageUrl && imageUrl.startsWith('data:')) {
      const bytes = Math.floor((imageUrl.length * 3) / 4);
      if (bytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'image too large (max ~2MB)' },
          { status: 413 }
        );
      }
    }
    if (logoUrl && logoUrl.startsWith('data:')) {
      const bytes = Math.floor((logoUrl.length * 3) / 4);
      if (bytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'logo too large (max ~2MB)' },
          { status: 413 }
        );
      }
    }

    await updateAboutSettings({
      textPt,
      textEn,
      imageUrl,
      imagePosition,
      logoUrl,
      links,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/coeiha/about PUT] error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
