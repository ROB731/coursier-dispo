"use client";

import { useState } from "react";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { RequireRole } from "@/components/RequireRole";
import { TopBar } from "@/components/TopBar";
import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement } = useUtilisateur();
  const [menuOuvert, setMenuOuvert] = useState(false);

  if (chargement || !utilisateur) return null;

  return (
    <RequireRole utilisateur={utilisateur} roles={["SUPER_ADMIN", "DIRECTEUR", "GERANTE"]}>
      <div className="app-shell">
        <TopBar
          utilisateur={utilisateur}
          titre="DISPO-COURSIER · Administration"
          left={
            <button
              type="button"
              className="btn-text nav-toggle"
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOuvert(true)}
            >
              ☰
            </button>
          }
        />
        <div className="app-shell-body">
          {/* Défile indépendamment du reste — voir .admin-sidebar dans globals.css */}
          <AdminNav ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} role={utilisateur.role} />
          {/* Zone de contenu : sa propre zone de défilement, séparée de la barre latérale */}
          <main className="scroll-region" style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </RequireRole>
  );
}
