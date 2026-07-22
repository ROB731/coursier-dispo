"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Utilisateur } from "@/lib/types";

export function TopBar({ utilisateur, titre }: { utilisateur: Utilisateur; titre: string }) {
  const router = useRouter();

  async function deconnexion() {
    await api.post("/api/auth/logout");
    router.push("/login");
  }

  return (
    <div className="top-bar">
      <strong>{titre}</strong>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{utilisateur.nomComplet}</span>
        <button type="button" className="btn-text" onClick={deconnexion}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
