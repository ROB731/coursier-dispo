"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { Coursier, Entreprise, Site, StatutCoursier } from "@/lib/types";
import { ActiviteModal } from "@/components/ActiviteModal";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { SearchableSelect } from "@/components/SearchableSelect";
import { StatutBadge } from "@/components/StatutBadge";
import { lireAfficherStatsGestion } from "@/lib/preferencesTableauDeBord";

interface CompteResume {
  id: string;
  actif: boolean;
}

interface TerminalResume {
  id: string;
  actif: boolean;
}

function Stat({
  label,
  valeur,
  lien,
  onClick,
}: {
  label: string;
  valeur: number | string;
  lien?: string;
  onClick?: () => void;
}) {
  const contenu = (
    <>
      <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{valeur}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{label}</div>
    </>
  );

  const style = { padding: "1rem", flex: "1 1 9rem", minWidth: "9rem", textAlign: "left" as const };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="card" style={style}>
        {contenu}
      </button>
    );
  }

  return (
    <Link href={lien!} className="card" style={style}>
      {contenu}
    </Link>
  );
}

function CarteIndicateur({
  icone,
  valeur,
  label,
  couleur,
  fond,
}: {
  icone: string;
  valeur: number;
  label: string;
  couleur: string;
  fond: string;
}) {
  return (
    <div
      className="card"
      style={{
        flex: "1 1 9rem",
        minWidth: "9rem",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        borderLeft: `4px solid ${couleur}`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "2.75rem",
          height: "2.75rem",
          borderRadius: "50%",
          background: fond,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          flexShrink: 0,
        }}
      >
        {icone}
      </div>
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: couleur, lineHeight: 1.1 }}>{valeur}</div>
        <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{label}</div>
      </div>
    </div>
  );
}

export default function TableauDeBordAdminPage() {
  const { utilisateur } = useUtilisateur();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [coursiers, setCoursiers] = useState<Coursier[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [comptes, setComptes] = useState<CompteResume[]>([]);
  const [bornes, setBornes] = useState<TerminalResume[]>([]);
  const [statuts, setStatuts] = useState<StatutCoursier[]>([]);
  const [activiteOuvert, setActiviteOuvert] = useState(false);
  const [afficherStatsGestion, setAfficherStatsGestion] = useState(false);

  const estSuperAdmin = utilisateur?.role === "SUPER_ADMIN";

  useEffect(() => {
    setAfficherStatsGestion(lireAfficherStatsGestion());
  }, []);

  useEffect(() => {
    api.get<Coursier[]>("/api/coursiers").then(setCoursiers);
    api.get<CompteResume[]>("/api/utilisateurs").then(setComptes).catch(() => {});
    api.get<TerminalResume[]>("/api/terminaux").then(setBornes);
    api.get<Entreprise[]>("/api/entreprises").then((liste) => {
      setEntreprises(liste);
      setEntrepriseId(liste[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!entrepriseId) return;
    api.get<Site[]>(`/api/sites?entrepriseId=${entrepriseId}`).then((liste) => {
      setSites(liste);
      const principal = liste.find((s) => s.estSitePrincipal) ?? liste[0];
      setSiteId(principal?.id ?? "");
    });
  }, [entrepriseId]);

  useEffect(() => {
    if (!siteId) {
      setStatuts([]);
      return;
    }
    api.get<StatutCoursier[]>(`/api/statuts/sites/${siteId}`).then(setStatuts);
  }, [siteId]);

  const disponibles = statuts.filter((s) => s.statut === "DISPONIBLE");
  const indisponibles = statuts.filter((s) => s.statut !== "DISPONIBLE");
  const afficherGestion = estSuperAdmin || afficherStatsGestion;

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Qui est disponible {statuts.length > 0 && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({statuts.length})</span>}
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {entreprises.length > 1 && (
            <div style={{ minWidth: "12rem" }}>
              <SearchableSelect
                options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
                value={entrepriseId}
                onChange={setEntrepriseId}
              />
            </div>
          )}
          {sites.length > 1 && (
            <div style={{ minWidth: "12rem" }}>
              <SearchableSelect options={sites.map((s) => ({ value: s.id, label: s.nom }))} value={siteId} onChange={setSiteId} />
            </div>
          )}
          <Link href="/app" className="btn-text" style={{ whiteSpace: "nowrap" }}>
            Vue plein écran →
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", margin: "1rem 0 1.25rem" }}>
        <CarteIndicateur icone="✅" valeur={disponibles.length} label="Disponibles" couleur="var(--color-disponible)" fond="var(--color-disponible-bg)" />
        <CarteIndicateur icone="⛔" valeur={indisponibles.length} label="Non disponibles" couleur="var(--color-non-disponible)" fond="var(--color-non-disponible-bg)" />
        <CarteIndicateur icone="👥" valeur={statuts.length} label="Coursiers concernés" couleur="var(--color-primary)" fond="var(--color-primary-soft)" />
      </div>

      {statuts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(9.5rem, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {statuts.map((s) => (
            <div
              key={s.coursierId}
              className="card"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1rem 0.75rem", gap: "0.5rem" }}
            >
              <img
                src={s.photoUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
              />
              <div>
                <strong style={{ display: "block" }}>
                  {s.prenom} {s.nom}
                </strong>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>{s.code}</span>
              </div>
              <StatutBadge statut={s.statut} />
            </div>
          ))}
        </div>
      )}

      {afficherGestion && (
        <>
          <h2 style={{ marginBottom: "0.75rem" }}>Gestion</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {estSuperAdmin && <Stat label="Entreprises" valeur={entreprises.filter((e) => e.actif).length} lien="/admin/entreprises" />}
            <Stat label="Coursiers actifs" valeur={coursiers.filter((c) => c.statutActif).length} lien="/admin/coursiers" />
            <Stat label="Sites" valeur={sites.length} lien="/admin/sites" />
            {utilisateur?.role !== "GERANTE" && (
              <Stat label="Comptes actifs" valeur={comptes.filter((c) => c.actif).length} lien="/admin/comptes" />
            )}
            <Stat label="À la porte" valeur={bornes.filter((b) => b.actif).length} lien="/admin/bornes" />
            {estSuperAdmin && <Stat label="Activité" valeur="Voir" onClick={() => setActiviteOuvert(true)} />}
          </div>
        </>
      )}

      {!afficherGestion && (
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          <Link href="/admin/profil" className="link">
            Mon profil
          </Link>{" "}
          — pour afficher les indicateurs de gestion (sites, comptes, à la porte) sur ce tableau de bord.
        </p>
      )}

      {bornes.length === 0 && (
        <p className="alert-banner warning" style={{ marginLeft: 0, marginRight: 0 }}>
          Aucun point « À la porte » configuré — les coursiers ne peuvent pas encore badger.{" "}
          <Link href="/admin/bornes" className="link" style={{ fontWeight: 700 }}>
            Configurer
          </Link>
          .
        </p>
      )}

      {activiteOuvert && <ActiviteModal onClose={() => setActiviteOuvert(false)} />}
    </div>
  );
}
