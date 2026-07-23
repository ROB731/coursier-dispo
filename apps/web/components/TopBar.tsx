"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Utilisateur } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

export function TopBar({
  utilisateur,
  titre,
  left,
}: {
  utilisateur: Utilisateur;
  titre: string;
  left?: React.ReactNode;
}) {
  const router = useRouter();

  async function deconnexion() {
    await api.post("/api/auth/logout");
    router.push("/login");
  }

  return (
    <div className="top-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: "1 1 auto" }}>
        {left}
        <strong className="top-bar-titre">{titre}</strong>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        {utilisateur.role !== "SUPER_ADMIN" && <NotificationBell />}
        <ThemeToggle />
        <span className="top-bar-utilisateur" style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          {utilisateur.nomComplet}
        </span>
        <button type="button" className="btn-text" onClick={deconnexion}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
