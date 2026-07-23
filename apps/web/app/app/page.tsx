"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { Site, StatutCoursier } from "@/lib/types";
import { StatutBadge } from "@/components/StatutBadge";
import { TopBar } from "@/components/TopBar";
import { SearchableSelect } from "@/components/SearchableSelect";

const INTERVALLE_PAR_DEFAUT_MS = 7000;

function formatDepuis(depuis: string | null): string {
  if (!depuis) return "";
  const date = new Date(depuis);
  return `depuis ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function TableauDeBordPage() {
  const { utilisateur, chargement } = useUtilisateur();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [statuts, setStatuts] = useState<StatutCoursier[]>([]);
  const [intervalleMs, setIntervalleMs] = useState(INTERVALLE_PAR_DEFAUT_MS);

  useEffect(() => {
    if (!utilisateur) return;
    api.get<Site[]>("/api/sites").then((liste) => {
      setSites(liste);
      setSiteId(utilisateur.siteParDefautId ?? liste[0]?.id ?? "");
    });
  }, [utilisateur]);

  useEffect(() => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;
    api
      .get<{ intervallePollingSecondes: number }>(`/api/parametres?entrepriseId=${site.entrepriseId}`)
      .then((p) => setIntervalleMs(p.intervallePollingSecondes * 1000))
      .catch(() => {});
  }, [sites, siteId]);

  const chargerStatuts = useCallback(async () => {
    if (!siteId) return;
    const data = await api.get<StatutCoursier[]>(`/api/statuts/sites/${siteId}`);
    setStatuts(data);
  }, [siteId]);

  useEffect(() => {
    if (!siteId) return;
    chargerStatuts();
    const intervalle = setInterval(chargerStatuts, intervalleMs);
    return () => clearInterval(intervalle);
  }, [siteId, intervalleMs, chargerStatuts]);

  if (chargement || !utilisateur) return null;

  const disponibles = statuts.filter((s) => s.statut === "DISPONIBLE").length;

  return (
    <div className="app-shell">
      <TopBar
        utilisateur={utilisateur}
        titre="DISPO-COURSIER"
        left={
          utilisateur.role !== "SUPER_ADMIN" ? (
            <Link href="/admin" className="btn-text" style={{ whiteSpace: "nowrap" }}>
              ☰ Gestion
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
          {statuts.map((s) => (
            <div
              key={s.coursierId}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem" }}
            >
              <img
                src={s.photoUrl}
                alt=""
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
              />
              <div style={{ flex: 1 }}>
                <strong>
                  {s.prenom} {s.nom}
                </strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{s.code}</span>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{formatDepuis(s.depuis)}</div>
              </div>
              <StatutBadge statut={s.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
