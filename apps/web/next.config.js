const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxifie l'API côté serveur pour que le navigateur ne parle jamais qu'à
  // une seule origine (celle du site) — indispensable en production : le
  // cookie de session, sinon posé sur le domaine de l'API, ne serait jamais
  // vu par le middleware Next.js qui protège /app et /admin sur le domaine
  // du site. Utile aussi en dev derrière un tunnel (ngrok).
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
      { source: "/health", destination: `${API_URL}/health` },
    ];
  },
};

module.exports = nextConfig;
