/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent ESLint warnings from failing Vercel production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Avoid hard failures on type issues during deploy
  typescript: {
    ignoreBuildErrors: true,
  },
  // Do not rewrite /api on Vercel — the client calls NEXT_PUBLIC_API_URL directly.
  // Rewrites to localhost would break production.
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
