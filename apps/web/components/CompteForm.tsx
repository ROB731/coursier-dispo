"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { Compte, DirecteurResume, Entreprise, Role, Site } from "@/lib/types";
import { LIBELLE_ROLE } from "@/lib/roles";
import { SearchableSelect } from "@/components/SearchableSelect";
import { MultiSearchableSelect } from "@/components/MultiSearchableSelect";

const TOUS_LES_ROLES: Role[] = ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"];

export function CompteForm({
  compte,
  roleCreateur,
  onSuccess,
}: {
  compte?: Compte;
  roleCreateur: Role;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const modification = Boolean(compte);

  const rolesDisponibles = roleCreateur === "DIRECTEUR" ? ["GERANTE" as Role] : TOUS_LES_ROLES;

  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [directeurs, setDirecteurs] = useState<DirecteurResume[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [role, setRole] = useState<Role>(compte?.role ?? rolesDisponibles[0]);
  const [entrepriseIds, setEntrepriseIds] = useState<string[]>(compte?.directeurEntreprises.map((d) => d.entrepriseId) ?? []);
  const [modeGerante, setModeGerante] = useState<"entreprise" | "directeur">(compte?.directeurId ? "directeur" : "entreprise");
  const [entrepriseIdGerante, setEntrepriseIdGerante] = useState(compte?.entrepriseId ?? "");
  const [directeurIdGerante, setDirecteurIdGerante] = useState(compte?.directeurId ?? "");
  const [siteParDefautId, setSiteParDefautId] = useState(compte?.siteParDefautId ?? "");

  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [reinitialisationEnCours, setReinitialisationEnCours] = useState(false);
  const [reinitialisationOk, setReinitialisationOk] = useState(false);

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then(setEntreprises);
    api.get<DirecteurResume[]>("/api/utilisateurs/directeurs").then(setDirecteurs);
    api.get<Site[]>("/api/sites").then(setSites);
  }, []);

  // Sites pertinents pour le sélecteur "site par défaut" du Gérant, selon son rattachement.
  const entreprisesEffectivesGerante =
    modeGerante === "entreprise"
      ? [entrepriseIdGerante].filter(Boolean)
      : directeurs.find((d) => d.id === directeurIdGerante)?.directeurEntreprises.map((d) => d.entrepriseId) ?? [];
  const sitesPourGerante = sites.filter((s) => entreprisesEffectivesGerante.includes(s.entrepriseId));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);

    if (role === "DIRECTEUR" && entrepriseIds.length === 0) {
      setErreur("Sélectionnez au moins une entreprise pour ce directeur");
      return;
    }
    if (role === "GERANTE" && modeGerante === "entreprise" && !entrepriseIdGerante) {
      setErreur("Sélectionnez l'entreprise de ce gérant");
      return;
    }
    if (role === "GERANTE" && modeGerante === "directeur" && !directeurIdGerante) {
      setErreur("Sélectionnez le directeur de ce gérant");
      return;
    }

    setEnCours(true);
    const form = new FormData(e.currentTarget);
    const valeur = (nom: string) => (form.get(nom) as string) || undefined;

    const rattachement =
      role === "DIRECTEUR"
        ? { entrepriseIds }
        : role === "GERANTE"
          ? modeGerante === "entreprise"
            ? { entrepriseId: entrepriseIdGerante }
            : { directeurId: directeurIdGerante }
          : {};

    try {
      if (modification && compte) {
        await api.patch(`/api/utilisateurs/${compte.id}`, {
          nomComplet: valeur("nomComplet"),
          telephone: valeur("telephone"),
          email: valeur("email"),
          siteParDefautId: siteParDefautId || undefined,
          ...rattachement,
        });
        showToast("Compte modifié avec succès");
      } else {
        await api.post("/api/utilisateurs", {
          identifiant: valeur("identifiant"),
          motDePasse: valeur("motDePasse"),
          role,
          nomComplet: valeur("nomComplet"),
          telephone: valeur("telephone"),
          email: valeur("email"),
          siteParDefautId: siteParDefautId || undefined,
          ...rattachement,
        });
        showToast("Compte créé avec succès");
      }
      onSuccess();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function reinitialiserMotDePasse() {
    if (!compte || nouveauMotDePasse.length < 4) return;
    setReinitialisationEnCours(true);
    setReinitialisationOk(false);
    try {
      await api.post(`/api/utilisateurs/${compte.id}/reinitialiser-mot-de-passe`, { motDePasse: nouveauMotDePasse });
      showToast("Mot de passe réinitialisé avec succès");
      setReinitialisationOk(true);
      setNouveauMotDePasse("");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de la réinitialisation");
    } finally {
      setReinitialisationEnCours(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="nomComplet">Nom complet *</label>
          <input id="nomComplet" name="nomComplet" required defaultValue={compte?.nomComplet} />
        </div>

        <div className="form-field">
          <label htmlFor="role">Rôle *</label>
          {modification ? (
            <p style={{ margin: 0, fontWeight: 600 }}>{LIBELLE_ROLE[role]}</p>
          ) : (
            <SearchableSelect
              options={rolesDisponibles.map((r) => ({ value: r, label: LIBELLE_ROLE[r] }))}
              value={role}
              onChange={(v) => setRole(v as Role)}
              placeholder="Sélectionner un rôle…"
            />
          )}
        </div>

        {role === "DIRECTEUR" && (
          <div className="form-field">
            <label>Entreprises supervisées *</label>
            <MultiSearchableSelect
              options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
              valeurs={entrepriseIds}
              onChange={setEntrepriseIds}
              placeholder="Ajouter une entreprise…"
            />
          </div>
        )}

        {role === "GERANTE" && (
          <>
            <div className="form-field">
              <label>Rattachement *</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={modeGerante === "entreprise" ? "btn btn-primary" : "btn btn-secondary"}
                  onClick={() => setModeGerante("entreprise")}
                  style={{ flex: 1 }}
                >
                  Entreprise directe
                </button>
                <button
                  type="button"
                  className={modeGerante === "directeur" ? "btn btn-primary" : "btn btn-secondary"}
                  onClick={() => setModeGerante("directeur")}
                  style={{ flex: 1 }}
                >
                  Via un directeur
                </button>
              </div>
            </div>

            {modeGerante === "entreprise" ? (
              <div className="form-field">
                <label>Entreprise *</label>
                <SearchableSelect
                  options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
                  value={entrepriseIdGerante}
                  onChange={setEntrepriseIdGerante}
                  placeholder="Sélectionner une entreprise…"
                />
              </div>
            ) : (
              <div className="form-field">
                <label>Directeur *</label>
                <SearchableSelect
                  options={directeurs.map((d) => ({ value: d.id, label: d.nomComplet }))}
                  value={directeurIdGerante}
                  onChange={setDirecteurIdGerante}
                  placeholder="Sélectionner un directeur…"
                />
              </div>
            )}

            {sitesPourGerante.length > 0 && (
              <div className="form-field">
                <label>Site par défaut</label>
                <SearchableSelect
                  options={sitesPourGerante.map((s) => ({ value: s.id, label: s.nom }))}
                  value={siteParDefautId}
                  onChange={setSiteParDefautId}
                  placeholder="Tous les sites de l'entreprise"
                />
              </div>
            )}
          </>
        )}

        {!modification && (
          <>
            <div className="form-field">
              <label htmlFor="identifiant">Identifiant de connexion *</label>
              <input id="identifiant" name="identifiant" required minLength={3} />
            </div>
            <div className="form-field">
              <label htmlFor="motDePasse">Mot de passe temporaire *</label>
              <input id="motDePasse" name="motDePasse" type="password" required minLength={4} />
            </div>
          </>
        )}

        <div className="form-field">
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" defaultValue={compte?.telephone ?? undefined} />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={compte?.email ?? undefined} />
        </div>

        {erreur && <p className="form-error">{erreur}</p>}

        <button type="submit" className="btn btn-primary" disabled={enCours} style={{ marginTop: "1rem" }}>
          {enCours ? "Enregistrement…" : modification ? "Enregistrer les modifications" : "Créer le compte"}
        </button>
      </form>

      {modification && compte && (
        <div className="card" style={{ padding: "1.25rem", marginTop: "2rem" }}>
          <h2 style={{ marginTop: 0 }}>Réinitialiser le mot de passe</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Définissez un nouveau mot de passe temporaire pour {compte.nomComplet}.
          </p>
          <div className="form-field">
            <label htmlFor="nouveauMotDePasse">Nouveau mot de passe</label>
            <input
              id="nouveauMotDePasse"
              type="password"
              minLength={4}
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
            />
          </div>
          {reinitialisationOk && <p style={{ color: "var(--color-disponible)", fontSize: "0.9rem" }}>Mot de passe mis à jour.</p>}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={nouveauMotDePasse.length < 4 || reinitialisationEnCours}
            onClick={reinitialiserMotDePasse}
          >
            {reinitialisationEnCours ? "Réinitialisation…" : "Réinitialiser"}
          </button>
        </div>
      )}
    </div>
  );
}
