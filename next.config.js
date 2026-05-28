/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: 'https://twitch-ranking-coeiha.vercel.app',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
      { protocol: 'https', hostname: 'decapi.me' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

module.exports = nextConfig;
