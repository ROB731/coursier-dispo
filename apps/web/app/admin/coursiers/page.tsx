"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { Coursier } from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { RequireRole } from "@/components/RequireRole";

export default function ListeCoursiersPage() {
  const { utilisateur, chargement } = useUtilisateur();
  const [coursiers, setCoursiers] = useState<Coursier[]>([]);

  async function recharger() {
    setCoursiers(await api.get<Coursier[]>("/api/coursiers"));
  }

  useEffect(() => {
    if (utilisateur) recharger();
  }, [utilisateur]);

  async function basculerActivation(c: Coursier) {
    const action = c.statutActif ? "desactiver" : "reactiver";
    await api.post(`/api/coursiers/${c.id}/${action}`);
    recharger();
  }

  if (chargement || !utilisateur) return null;

  return (
    <RequireRole utilisateur={utilisateur} roles={["SUPER_ADMIN"]}>
      <main>
        <TopBar utilisateur={utilisateur} titre="Administration · Coursiers" />
        <div className="container">
          <Link href="/admin/coursiers/nouveau" className="btn btn-primary">
            + Ajouter un coursier
          </Link>

          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {coursiers.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem" }}
              >
                <img
                  src={c.photoUrl}
                  alt=""
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
                />
                <div style={{ flex: 1 }}>
                  <strong>
                    {c.prenom} {c.nom}
                  </strong>
                  <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{c.code}</span>
                </div>
                <span className={`badge ${c.statutActif ? "badge-disponible" : "badge-non-disponible"}`}>
                  {c.statutActif ? "Actif" : "Désactivé"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(c)}>
                  {c.statutActif ? "Désactiver" : "Réactiver"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </RequireRole>
  );
}
