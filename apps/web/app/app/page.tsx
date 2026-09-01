"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { Site, StatutCoursier } from "@/lib/types";
import { StatutBadge } from "@/components/StatutBadge";
import { TopBar } from "@/components/TopBar";
import { SearchableSelect } from "@/components/SearchableSelect";
import { IconMenu, IconRefresh } from "@/components/icons";

function formatDepuis(depuis: string | null): string {
  if (!depuis) return "";
  const date = new Date(depuis);
  return `depuis ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatHeure(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function TableauDeBordPage() {
  const { utilisateur, chargement } = useUtilisateur();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [statuts, setStatuts] = useState<StatutCoursier[]>([]);
  const [actualisation, setActualisation] = useState(false);
  const [dernierRafraichissement, setDernierRafraichissement] = useState<Date | null>(null);

  useEffect(() => {
    if (!utilisateur) return;
    api.get<Site[]>("/api/sites").then((liste) => {
      setSites(liste);
      setSiteId(utilisateur.siteParDefautId ?? liste[0]?.id ?? "");
    });
  }, [utilisateur]);

  // Pas de polling automatique — on charge à l'ouverture / au changement de
  // site, puis uniquement quand la personne clique sur Actualiser. Le budget
  // de requêtes de la base est trop serré pour un rafraîchissement continu ;
  // les alertes Push préviennent déjà des changements importants entre deux clics.
  const chargerStatuts = useCallback(async () => {
    if (!siteId) return;
    setActualisation(true);
    try {
      const data = await api.get<StatutCoursier[]>(`/api/statuts/sites/${siteId}`);
      setStatuts(data);
      setDernierRafraichissement(new Date());
    } finally {
      setActualisation(false);
    }
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

        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.6rem", paddingBottom: 0 }}>
          {dernierRafraichissement && (
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Actualisé à {formatHeure(dernierRafraichissement)}
            </span>
          )}
          <button
            type="button"
            className="btn-text"
            onClick={chargerStatuts}
            disabled={actualisation}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <IconRefresh size={15} style={actualisation ? { animation: "tourner 0.8s linear infinite" } : undefined} /> Actualiser
          </button>
        </div>

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
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{formatDepuis(s.depuis)}</div>
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
