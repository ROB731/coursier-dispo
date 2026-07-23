"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { Utilisateur } from "@/lib/types";
import { LIBELLE_ROLE } from "@/lib/roles";
import { ecrireAfficherStatsGestion, lireAfficherStatsGestion } from "@/lib/preferencesTableauDeBord";

export default function MonProfilPage() {
  const { showToast } = useToast();
  const { utilisateur, chargement } = useUtilisateur();
  const [enCoursInfos, setEnCoursInfos] = useState(false);
  const [erreurInfos, setErreurInfos] = useState<string | null>(null);
  const [enCoursMdp, setEnCoursMdp] = useState(false);
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [afficherStats, setAfficherStats] = useState(false);

  useEffect(() => {
    setAfficherStats(lireAfficherStatsGestion());
  }, []);

  async function enregistrerInfos(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreurInfos(null);
    setEnCoursInfos(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.patch<Utilisateur>("/api/auth/me", {
        nomComplet: form.get("nomComplet"),
        telephone: (form.get("telephone") as string) || undefined,
        email: (form.get("email") as string) || undefined,
      });
      showToast("Profil mis à jour avec succès");
    } catch (err) {
      setErreurInfos(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCoursInfos(false);
    }
  }

  async function changerMotDePasse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreurMdp(null);
    setEnCoursMdp(true);
    const form = new FormData(e.currentTarget);
    const nouveau = form.get("nouveauMotDePasse") as string;
    const confirmation = form.get("confirmation") as string;
    if (nouveau !== confirmation) {
      setErreurMdp("La confirmation ne correspond pas au nouveau mot de passe");
      setEnCoursMdp(false);
      return;
    }
    try {
      await api.post("/api/auth/me/mot-de-passe", {
        motDePasseActuel: form.get("motDePasseActuel"),
        nouveauMotDePasse: nouveau,
      });
      showToast("Mot de passe modifié avec succès");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setErreurMdp(err instanceof ApiError ? err.message : "Échec du changement de mot de passe");
    } finally {
      setEnCoursMdp(false);
    }
  }

  function surChangementStats(valeur: boolean) {
    setAfficherStats(valeur);
    ecrireAfficherStatsGestion(valeur);
  }

  if (chargement || !utilisateur) return null;

  return (
    <div className="container" style={{ maxWidth: "30rem" }}>
      <h1>Mon profil</h1>

      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          @{utilisateur.identifiant} · {LIBELLE_ROLE[utilisateur.role]}
        </div>
      </div>

      <form onSubmit={enregistrerInfos} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Mes informations</h2>
        <div className="form-field">
          <label htmlFor="nomComplet">Nom complet *</label>
          <input id="nomComplet" name="nomComplet" required defaultValue={utilisateur.nomComplet} />
        </div>
        <div className="form-field">
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" defaultValue={utilisateur.telephone ?? ""} />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={utilisateur.email ?? ""} />
        </div>
        {erreurInfos && <p className="form-error">{erreurInfos}</p>}
        <button type="submit" className="btn btn-primary" disabled={enCoursInfos}>
          {enCoursInfos ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={changerMotDePasse} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Changer mon mot de passe</h2>
        <div className="form-field">
          <label htmlFor="motDePasseActuel">Mot de passe actuel *</label>
          <input id="motDePasseActuel" name="motDePasseActuel" type="password" required />
        </div>
        <div className="form-field">
          <label htmlFor="nouveauMotDePasse">Nouveau mot de passe *</label>
          <input id="nouveauMotDePasse" name="nouveauMotDePasse" type="password" required minLength={4} />
        </div>
        <div className="form-field">
          <label htmlFor="confirmation">Confirmer le nouveau mot de passe *</label>
          <input id="confirmation" name="confirmation" type="password" required minLength={4} />
        </div>
        {erreurMdp && <p className="form-error">{erreurMdp}</p>}
        <button type="submit" className="btn btn-primary" disabled={enCoursMdp}>
          {enCoursMdp ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>

      {utilisateur.role !== "SUPER_ADMIN" && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 style={{ marginTop: 0 }}>Affichage du tableau de bord</h2>
          <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="afficherStats"
              type="checkbox"
              style={{ width: "auto", minHeight: "auto" }}
              checked={afficherStats}
              onChange={(e) => surChangementStats(e.target.checked)}
            />
            <label htmlFor="afficherStats" style={{ marginBottom: 0 }}>
              Afficher les indicateurs de gestion (sites, comptes, à la porte) sur mon tableau de bord
            </label>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: 0 }}>
            Masqués par défaut pour garder l'essentiel visible en un coup d'œil : qui est disponible maintenant.
          </p>
        </div>
      )}
    </div>
  );
}
