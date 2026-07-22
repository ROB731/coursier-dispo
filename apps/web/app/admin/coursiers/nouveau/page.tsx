"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { ProfilHoraire, Site } from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { RequireRole } from "@/components/RequireRole";

const TYPES_CONTRAT = ["CDI", "CDD", "STAGIAIRE", "PRESTATAIRE"] as const;

export default function NouveauCoursierPage() {
  const { utilisateur, chargement } = useUtilisateur();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [profils, setProfils] = useState<ProfilHoraire[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!utilisateur) return;
    api.get<Site[]>("/api/sites").then(setSites);
    api.get<ProfilHoraire[]>("/api/profils-horaires").then(setProfils);
  }, [utilisateur]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    const form = new FormData(e.currentTarget);
    const valeur = (nom: string) => (form.get(nom) as string) || undefined;

    try {
      await api.post("/api/coursiers", {
        code: valeur("code"),
        photoUrl: valeur("photoUrl"),
        prenom: valeur("prenom"),
        nom: valeur("nom"),
        telephone: valeur("telephone"),
        email: valeur("email"),
        dateNaissance: valeur("dateNaissance"),
        adresse: valeur("adresse"),
        typeContrat: valeur("typeContrat"),
        dateEmbauche: valeur("dateEmbauche"),
        contactUrgenceNom: valeur("contactUrgenceNom"),
        contactUrgenceTelephone: valeur("contactUrgenceTelephone"),
        profilHoraireId: valeur("profilHoraireId"),
        siteId: valeur("siteId"),
        notes: valeur("notes"),
      });
      router.push("/admin/coursiers");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de la création");
    } finally {
      setEnCours(false);
    }
  }

  if (chargement || !utilisateur) return null;

  return (
    <RequireRole utilisateur={utilisateur} roles={["SUPER_ADMIN"]}>
      <main>
        <TopBar utilisateur={utilisateur} titre="Administration · Nouveau coursier" />
        <form onSubmit={onSubmit} className="container" style={{ maxWidth: 560 }}>
          <h2>Identification</h2>
          <div className="form-field">
            <label htmlFor="code">Code unique *</label>
            <input id="code" name="code" required placeholder="Ex. CE120" />
          </div>
          <div className="form-field">
            <label htmlFor="photoUrl">Photo (URL) *</label>
            <input id="photoUrl" name="photoUrl" required placeholder="https://…" />
          </div>
          <div className="form-field">
            <label htmlFor="prenom">Prénom *</label>
            <input id="prenom" name="prenom" required />
          </div>
          <div className="form-field">
            <label htmlFor="nom">Nom *</label>
            <input id="nom" name="nom" required />
          </div>

          <h2>Coordonnées</h2>
          <div className="form-field">
            <label htmlFor="telephone">Téléphone</label>
            <input id="telephone" name="telephone" />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" />
          </div>
          <div className="form-field">
            <label htmlFor="adresse">Adresse</label>
            <input id="adresse" name="adresse" />
          </div>

          <h2>Dossier</h2>
          <div className="form-field">
            <label htmlFor="dateNaissance">Date de naissance</label>
            <input id="dateNaissance" name="dateNaissance" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="typeContrat">Type de contrat</label>
            <select id="typeContrat" name="typeContrat" defaultValue="">
              <option value="">—</option>
              {TYPES_CONTRAT.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dateEmbauche">Date d&apos;embauche</label>
            <input id="dateEmbauche" name="dateEmbauche" type="date" />
          </div>

          <h2>Contact d&apos;urgence</h2>
          <div className="form-field">
            <label htmlFor="contactUrgenceNom">Nom</label>
            <input id="contactUrgenceNom" name="contactUrgenceNom" />
          </div>
          <div className="form-field">
            <label htmlFor="contactUrgenceTelephone">Téléphone</label>
            <input id="contactUrgenceTelephone" name="contactUrgenceTelephone" />
          </div>

          <h2>Affectation</h2>
          <div className="form-field">
            <label htmlFor="siteId">Site *</label>
            <select id="siteId" name="siteId" required defaultValue="">
              <option value="" disabled>
                Sélectionner…
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="profilHoraireId">Profil horaire *</label>
            <select id="profilHoraireId" name="profilHoraireId" required defaultValue="">
              <option value="" disabled>
                Sélectionner…
              </option>
              {profils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.heureDebut}–{p.heureFin})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notes internes</label>
            <textarea id="notes" name="notes" rows={3} />
          </div>

          {erreur && <p className="form-error">{erreur}</p>}

          <button type="submit" className="btn btn-primary" disabled={enCours} style={{ marginTop: "1rem" }}>
            {enCours ? "Création…" : "Créer le coursier"}
          </button>
        </form>
      </main>
    </RequireRole>
  );
}
