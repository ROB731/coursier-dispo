"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { EvenementHistorique, Site, TypeEvenement } from "@/lib/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";

const LIBELLE_TYPE: Record<TypeEvenement, string> = {
  ENTREE: "Entrée",
  SORTIE: "Sortie",
  ANNULATION: "Annulation",
  CLOTURE_AUTO: "Clôture auto.",
};

const LIBELLE_SOURCE: Record<string, string> = {
  BORNE: "À la porte",
  COMPTE: "Compte",
  SYSTEME: "Système",
};

function badgeType(type: TypeEvenement) {
  if (type === "ENTREE") return "badge-disponible";
  if (type === "SORTIE") return "badge-non-disponible";
  return "badge-non-disponible";
}

export default function HistoriquePage() {
  const [evenements, setEvenements] = useState<EvenementHistorique[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [utilisateurId, setUtilisateurId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheDebounce, setRechercheDebounce] = useState("");
  const [depuis, setDepuis] = useState("");
  const [jusqua, setJusqua] = useState("");
  const [chargement, setChargement] = useState(true);
  const [utilisateursConnus, setUtilisateursConnus] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    api.get<Site[]>("/api/sites").then(setSites);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setRechercheDebounce(recherche.trim()), 300);
    return () => clearTimeout(t);
  }, [recherche]);

  useEffect(() => {
    setChargement(true);
    const params = new URLSearchParams();
    if (siteId) params.set("siteId", siteId);
    if (utilisateurId) params.set("utilisateurId", utilisateurId);
    if (rechercheDebounce) params.set("recherche", rechercheDebounce);
    if (depuis) params.set("depuis", new Date(depuis).toISOString());
    if (jusqua) params.set("jusqua", new Date(jusqua).toISOString());
    const qs = params.toString();
    api
      .get<EvenementHistorique[]>(`/api/evenements${qs ? `?${qs}` : ""}`)
      .then(setEvenements)
      .finally(() => setChargement(false));
  }, [siteId, utilisateurId, rechercheDebounce, depuis, jusqua]);

  // Liste des comptes ayant agi, dérivée d'un chargement large non filtré par utilisateur —
  // évite un endpoint dédié et respecte déjà le périmètre (les événements sont pré-filtrés côté API).
  useEffect(() => {
    api.get<EvenementHistorique[]>("/api/evenements").then((liste) => {
      const connus = new Map<string, string>();
      for (const e of liste) {
        if (e.creeParUtilisateur) connus.set(e.creeParUtilisateur.id, e.creeParUtilisateur.nomComplet);
      }
      setUtilisateursConnus(connus);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const optionsUtilisateurs = useMemo(
    () => [{ value: "", label: "Tous les comptes" }, ...[...utilisateursConnus].filter(([id]) => id).map(([id, nom]) => ({ value: id, label: nom }))],
    [utilisateursConnus]
  );

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(evenements);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Historique {!chargement && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({evenements.length})</span>}
        </h1>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", margin: "1rem 0" }}>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un coursier (nom, code)…"
          style={{ minWidth: "14rem", flex: "1 1 14rem" }}
        />
        {sites.length > 1 && (
          <div style={{ minWidth: "12rem" }}>
            <SearchableSelect
              options={[{ value: "", label: "Tous les sites" }, ...sites.map((s) => ({ value: s.id, label: s.nom }))]}
              value={siteId}
              onChange={setSiteId}
              placeholder="Tous les sites"
            />
          </div>
        )}
        <div style={{ minWidth: "12rem" }}>
          <SearchableSelect
            options={optionsUtilisateurs}
            value={utilisateurId}
            onChange={setUtilisateurId}
            placeholder="Tous les comptes"
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: 0, fontSize: "0.85rem" }}>
          Depuis
          <input type="datetime-local" value={depuis} onChange={(e) => setDepuis(e.target.value)} style={{ minHeight: "auto" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: 0, fontSize: "0.85rem" }}>
          Jusqu'à
          <input type="datetime-local" value={jusqua} onChange={(e) => setJusqua(e.target.value)} style={{ minHeight: "auto" }} />
        </label>
      </div>

      {chargement && <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>}

      {!chargement && evenements.length === 0 && <p style={{ color: "var(--color-text-muted)" }}>Aucun événement trouvé.</p>}

      {!chargement && evenements.length > 0 && (
        <div className="table-wrap table-wrap-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date / Heure</th>
                <th>Coursier</th>
                <th>Type</th>
                <th>Site</th>
                <th>Origine</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((e, index) => (
                <tr key={e.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(e.horodatage).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td>
                    {e.coursier.prenom} {e.coursier.nom} <span style={{ color: "var(--color-text-muted)" }}>{e.coursier.code}</span>
                  </td>
                  <td>
                    <span className={`badge ${badgeType(e.type)}`}>{LIBELLE_TYPE[e.type]}</span>
                    {e.evenementAnnule && (
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                        Annule : {LIBELLE_TYPE[e.evenementAnnule.type]} du{" "}
                        {new Date(e.evenementAnnule.horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </td>
                  <td>{e.site.nom}</td>
                  <td>
                    {LIBELLE_SOURCE[e.source]}
                    {e.terminal && <span style={{ color: "var(--color-text-muted)" }}> · {e.terminal.nom}</span>}
                    {e.creeParUtilisateur && <span style={{ color: "var(--color-text-muted)" }}> · {e.creeParUtilisateur.nomComplet}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} nbPages={nbPages} onChange={setPage} />
    </div>
  );
}
