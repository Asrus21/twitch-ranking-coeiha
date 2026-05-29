/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app is served from a nested route on a custom domain, so static
  // assets must be referenced by absolute URL — without this the CSS/JS
  // chunks fail to resolve and the page renders unstyled.
  assetPrefix: 'https://twitch-ranking-coeiha.vercel.app',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
      { protocol: 'https', hostname: 'decapi.me' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'media.rawg.io' },
      { protocol: 'https', hostname: 'cdn.akamai.steamstatic.com' },
    ],
  },
};

module.exports = nextConfig;
