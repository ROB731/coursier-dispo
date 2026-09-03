"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { EvenementHistorique, Site, TypeEvenement } from "@/lib/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";
import { IconArrowLeft, IconArrowRight, IconDownload, IconPrinter } from "@/components/icons";

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

function valeurDateLocale(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${annee}-${mois}-${jour}T${heures}:${minutes}`;
}

function debutJour(date: Date): Date {
  const resultat = new Date(date);
  resultat.setHours(0, 0, 0, 0);
  return resultat;
}

function finJour(date: Date): Date {
  const resultat = new Date(date);
  resultat.setHours(23, 59, 59, 999);
  return resultat;
}

function csvCellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

export default function HistoriquePage() {
  const maintenant = new Date();
  const [depuis, setDepuis] = useState(valeurDateLocale(debutJour(maintenant)));
  const [jusqua, setJusqua] = useState(valeurDateLocale(finJour(maintenant)));
  const [evenements, setEvenements] = useState<EvenementHistorique[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [utilisateurId, setUtilisateurId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheDebounce, setRechercheDebounce] = useState("");
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

  function naviguerDUnJour(nombreJours: number) {
    const debut = new Date(depuis);
    const fin = new Date(jusqua);
    debut.setDate(debut.getDate() + nombreJours);
    fin.setDate(fin.getDate() + nombreJours);
    setDepuis(valeurDateLocale(debut));
    setJusqua(valeurDateLocale(fin));
  }

  function exporterCsv() {
    const entetes = ["Date / Heure", "Coursier", "Code", "Type", "Site", "Origine", "Détails"];
    const lignes = evenements.map((e) => [
      new Date(e.horodatage).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      `${e.coursier.prenom} ${e.coursier.nom}`,
      e.coursier.code,
      LIBELLE_TYPE[e.type],
      e.site.nom,
      `${LIBELLE_SOURCE[e.source]}${e.terminal ? ` · ${e.terminal.nom}` : ""}${e.creeParUtilisateur ? ` · ${e.creeParUtilisateur.nomComplet}` : ""}`,
      e.evenementAnnule ? `Annule : ${LIBELLE_TYPE[e.evenementAnnule.type]}` : "",
    ]);
    const contenu = [entetes, ...lignes].map((ligne) => ligne.map(csvCellule).join(";")).join("\r\n");
    const fichier = new Blob(["\uFEFF", contenu], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(fichier);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `historique-${depuis.slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  function imprimer() {
    window.print();
  }

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(evenements, 200);

  return (
    <div className="container historique-page">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Historique {!chargement && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({evenements.length})</span>}
        </h1>
        <div className="historique-actions">
          <button type="button" className="btn btn-secondary" onClick={exporterCsv} disabled={chargement || evenements.length === 0}>
            <IconDownload size={16} /> Exporter
          </button>
          <button type="button" className="btn btn-secondary" onClick={imprimer} disabled={chargement || evenements.length === 0}>
            <IconPrinter size={16} /> Imprimer
          </button>
        </div>
      </div>

      <div className="historique-filtres">
        <div className="historique-filtres-principaux">
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un coursier (nom, code)…"
          />
          {sites.length > 1 && (
            <SearchableSelect
              options={[{ value: "", label: "Tous les sites" }, ...sites.map((s) => ({ value: s.id, label: s.nom }))]}
              value={siteId}
              onChange={setSiteId}
              placeholder="Tous les sites"
            />
          )}
          <SearchableSelect
            options={optionsUtilisateurs}
            value={utilisateurId}
            onChange={setUtilisateurId}
            placeholder="Tous les comptes"
          />
        </div>
        <div className="historique-navigation-dates">
          <button type="button" className="btn btn-secondary" onClick={() => naviguerDUnJour(-1)} aria-label="Jour précédent" title="Jour précédent">
            <IconArrowLeft size={16} />
          </button>
          <div className="historique-plage-dates">
            <label>
              <span>Depuis</span>
              <input type="datetime-local" value={depuis} onChange={(e) => setDepuis(e.target.value)} />
            </label>
            <label>
              <span>Jusqu&apos;à</span>
              <input type="datetime-local" value={jusqua} onChange={(e) => setJusqua(e.target.value)} />
            </label>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => naviguerDUnJour(1)} aria-label="Jour suivant" title="Jour suivant">
            <IconArrowRight size={16} />
          </button>
        </div>
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
