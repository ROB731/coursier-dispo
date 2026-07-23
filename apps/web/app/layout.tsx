import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "DISPO-COURSIER",
  description: "Visibilité en temps réel des coursiers présents au siège — IVOIRRAPID",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dispo-Coursier",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#175a6a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <script
          // Appliqué avant l'hydratation pour éviter un flash — le clair reste
          // le thème par défaut, seul un choix explicite en localStorage bascule en sombre.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("dispo-coursier-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}`,
          }}
        />
        <RegisterServiceWorker />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
