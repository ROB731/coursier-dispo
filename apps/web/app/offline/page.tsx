"use client";

import { IconBan } from "@/components/icons";

/** Servie par le service worker (fetch, mode "navigate") quand le réseau
 * est indisponible — jamais atteinte par une navigation normale. Contenu
 * volontairement statique, aucun appel réseau. */
export default function OfflinePage() {
  return (
    <div className="app-shell">
      <div
        className="scroll-region container"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1rem" }}
      >
        <IconBan size={40} style={{ color: "var(--color-text-muted)" }} />
        <div>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>Pas de connexion</h1>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 1.25rem" }}>
            Vérifiez le réseau, puis réessayez.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}
