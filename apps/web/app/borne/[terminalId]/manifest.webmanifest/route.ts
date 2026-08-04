import { NextResponse } from "next/server";

// Manifeste PWA propre à chaque point "À la porte" : contrairement au
// manifeste global (start_url="/login"), celui-ci ouvre directement sur ce
// terminal — installé une fois sur la tablette, plus besoin de retaper
// l'adresse ni de repasser par le site à chaque redémarrage.
export function GET(_req: Request, { params }: { params: { terminalId: string } }) {
  const url = `/borne/${params.terminalId}`;

  return NextResponse.json(
    {
      name: "DISPO-COURSIER · À la porte",
      short_name: "À la porte",
      description: "Point de badgeage des coursiers",
      start_url: url,
      scope: url,
      id: url,
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#175a6a",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
