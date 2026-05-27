import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 30; // cache 30s

type TokenCache = { token: string; expires: number };
let tokenCache: TokenCache | null = null;

async function getAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && tokenCache.expires > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expires: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.token;
}

const CHANNEL = 'coeiha';

export async function GET() {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const token = await getAppToken();

    if (!clientId || !token) {
      // Fallback: no creds configured, return offline status
      return NextResponse.json({
        live: false,
        channel: CHANNEL,
        configured: false,
      });
    }

    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`,
      {
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ live: false, channel: CHANNEL, configured: true });
    }

    const data = await res.json();
    const stream = data.data?.[0];

    if (!stream) {
      return NextResponse.json({ live: false, channel: CHANNEL, configured: true });
    }

    return NextResponse.json({
      live: true,
      channel: CHANNEL,
      configured: true,
      title: stream.title,
      game: stream.game_name,
      viewers: stream.viewer_count,
      thumbnail: stream.thumbnail_url
        .replace('{width}', '640')
        .replace('{height}', '360'),
      startedAt: stream.started_at,
    });
  } catch (err) {
    console.error('[/api/twitch-status] error', err);
    return NextResponse.json({ live: false, channel: CHANNEL, configured: false });
  }
}
