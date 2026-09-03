"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { Site, StatutCoursier } from "@/lib/types";
import { StatutBadge } from "@/components/StatutBadge";
import { TopBar } from "@/components/TopBar";
import { SearchableSelect } from "@/components/SearchableSelect";
import { IconMenu } from "@/components/icons";
import { formatDepuis } from "@/lib/dates";

export default function TableauDeBordPage() {
  const { utilisateur, chargement } = useUtilisateur();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [statuts, setStatuts] = useState<StatutCoursier[]>([]);

  useEffect(() => {
    if (!utilisateur) return;
    api.get<Site[]>("/api/sites").then((liste) => {
      setSites(liste);
      setSiteId(utilisateur.siteParDefautId ?? liste[0]?.id ?? "");
    });
  }, [utilisateur]);

  // Pas de polling automatique — on charge à l'ouverture / au changement de
  // site. Le bouton Actualiser (dans TopBar, partagé par tous les écrans)
  // recharge la page entière ensuite ; le budget de requêtes de la base est
  // trop serré pour un rafraîchissement continu, et les alertes Push
  // préviennent déjà des changements importants entre deux rechargements.
  const chargerStatuts = useCallback(async () => {
    if (!siteId) return;
    const data = await api.get<StatutCoursier[]>(`/api/statuts/sites/${siteId}`);
    setStatuts(data);
  }, [siteId]);

  useEffect(() => {
    if (!siteId) return;
    chargerStatuts();
  }, [siteId, chargerStatuts]);

  if (chargement || !utilisateur) return null;

  const disponibles = statuts.filter((s) => s.statut === "DISPONIBLE").length;

  return (
    <div className="app-shell">
      <TopBar
        utilisateur={utilisateur}
        titre="DISPO-COURSIER"
        left={
          utilisateur.role !== "SUPER_ADMIN" ? (
            <Link
              href="/admin"
              className="btn-text"
              style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <IconMenu size={15} /> Gestion
            </Link>
          ) : undefined
        }
      />

      <div className="scroll-region">
        {sites.length > 1 && (
          <div className="container" style={{ paddingBottom: 0, maxWidth: "20rem" }}>
            <SearchableSelect options={sites.map((s) => ({ value: s.id, label: s.nom }))} value={siteId} onChange={setSiteId} />
          </div>
        )}

        <p className={`alert-banner ${disponibles > 0 ? "info" : "warning"}`}>
          {disponibles > 0
            ? `${disponibles} coursier${disponibles > 1 ? "s" : ""} disponible${disponibles > 1 ? "s" : ""}`
            : "Aucun coursier disponible actuellement"}
        </p>

        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {statuts.map((s) => {
            const journeeTerminee = s.statut !== "DISPONIBLE" && s.journeeTerminee;
            return (
              <div
                key={s.coursierId}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", opacity: journeeTerminee ? 0.65 : 1 }}
              >
                <img
                  src={s.photoUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "var(--color-border)",
                    filter: journeeTerminee ? "grayscale(0.7)" : "none",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <strong>
                    {s.prenom} {s.nom}
                  </strong>
                  <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{s.code}</span>
                  <small style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{formatDepuis(s.depuis)}</small>
                </div>
                <StatutBadge statut={s.statut} journeeTerminee={s.journeeTerminee} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
