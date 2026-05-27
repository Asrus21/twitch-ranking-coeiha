import { NextRequest, NextResponse } from 'next/server';
import { recordPonto } from '@/lib/db';

export const runtime = 'nodejs';

// CORS so the StreamElements widget (different origin) can call us
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Widget-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    // Lightweight shared-secret check so randos can't spam the API.
    // Set WIDGET_KEY in Vercel env vars and in the widget JS.
    const expectedKey = process.env.WIDGET_KEY;
    if (expectedKey) {
      const key = req.headers.get('x-widget-key');
      if (key !== expectedKey) {
        return NextResponse.json(
          { error: 'unauthorized' },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    const body = await req.json();
    const { username, displayName, avatar } = body as {
      username?: string;
      displayName?: string;
      avatar?: string;
    };

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'username required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await recordPonto({
      username: username.trim(),
      displayName: (displayName || username).trim(),
      avatar:
        avatar ||
        'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png',
    });

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[/api/ponto] error', err);
    return NextResponse.json(
      { error: 'server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
