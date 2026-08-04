/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxifie l'API côté serveur (même origine pour le navigateur) — utile en
  // dev derrière un tunnel (ngrok) où le navigateur distant n'a pas accès à
  // "localhost:4000". Sans effet si NEXT_PUBLIC_API_URL reste absolu.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:4000/api/:path*" },
      { source: "/uploads/:path*", destination: "http://localhost:4000/uploads/:path*" },
      { source: "/health", destination: "http://localhost:4000/health" },
    ];
  },
};

module.exports = nextConfig;
