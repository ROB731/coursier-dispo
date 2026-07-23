"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { Coursier, Entreprise, ProfilHoraire, Site } from "@/lib/types";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { SearchableSelect } from "@/components/SearchableSelect";
import { libelleHoraires } from "@/components/ProfilsHorairesModal";

const TYPES_CONTRAT = ["CDI", "CDD", "STAGIAIRE", "PRESTATAIRE"] as const;
const LIBELLE_TYPE_CONTRAT: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGIAIRE: "Stagiaire",
  PRESTATAIRE: "Prestataire",
};

function versDateInput(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 10);
}

export function CoursierForm({ coursier, onSuccess }: { coursier?: Coursier; onSuccess: () => void }) {
  const { showToast } = useToast();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [profils, setProfils] = useState<ProfilHoraire[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [entrepriseId, setEntrepriseId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [profilHoraireId, setProfilHoraireId] = useState(coursier?.profilHoraireId ?? "");
  const [typeContrat, setTypeContrat] = useState(coursier?.typeContrat ?? "");

  const modification = Boolean(coursier);

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then(setEntreprises);
    api.get<Site[]>("/api/sites").then(setSites);
    api.get<ProfilHoraire[]>("/api/profils-horaires").then(setProfils);
  }, []);

  const sitesFiltres = entrepriseId ? sites.filter((s) => s.entrepriseId === entrepriseId) : sites;
  const profilsFiltres = entrepriseId ? profils.filter((p) => p.entrepriseId === entrepriseId) : profils;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);

    const form = new FormData(e.currentTarget);
    const valeur = (nom: string) => (form.get(nom) as string) || undefined;

    if (!valeur("photoUrl")) {
      setErreur("Veuillez ajouter une photo");
      return;
    }
    if (!modification && (!entrepriseId || !siteId)) {
      setErreur("Sélectionnez l'entreprise et le site du coursier");
      return;
    }
    if (!profilHoraireId) {
      setErreur("Sélectionnez un profil horaire");
      return;
    }

    setEnCours(true);

    const payload = {
      code: valeur("code"),
      photoUrl: valeur("photoUrl"),
      prenom: valeur("prenom"),
      nom: valeur("nom"),
      telephone: valeur("telephone"),
      email: valeur("email"),
      dateNaissance: valeur("dateNaissance"),
      adresse: valeur("adresse"),
      typeContrat: typeContrat || undefined,
      dateEmbauche: valeur("dateEmbauche"),
      contactUrgenceNom: valeur("contactUrgenceNom"),
      contactUrgenceTelephone: valeur("contactUrgenceTelephone"),
      profilHoraireId,
      notes: valeur("notes"),
    };

    try {
      if (modification && coursier) {
        await api.patch(`/api/coursiers/${coursier.id}`, payload);
        showToast("Coursier modifié avec succès");
      } else {
        await api.post("/api/coursiers", { ...payload, siteId });
        showToast("Coursier enregistré avec succès");
      }
      onSuccess();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h2 style={{ marginTop: 0 }}>Identification</h2>
      <div className="form-field">
        <label htmlFor="code">Code unique *</label>
        <input id="code" name="code" required placeholder="Ex. CE120" defaultValue={coursier?.code} />
      </div>
      <PhotoUploadField valeurInitiale={coursier?.photoUrl} />
      <div className="form-field">
        <label htmlFor="prenom">Prénom *</label>
        <input id="prenom" name="prenom" required defaultValue={coursier?.prenom} />
      </div>
      <div className="form-field">
        <label htmlFor="nom">Nom *</label>
        <input id="nom" name="nom" required defaultValue={coursier?.nom} />
      </div>

      <h2>Coordonnées</h2>
      <div className="form-field">
        <label htmlFor="telephone">Téléphone</label>
        <input id="telephone" name="telephone" defaultValue={coursier?.telephone ?? undefined} />
      </div>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={coursier?.email ?? undefined} />
      </div>
      <div className="form-field">
        <label htmlFor="adresse">Adresse</label>
        <input id="adresse" name="adresse" defaultValue={coursier?.adresse ?? undefined} />
      </div>

      <h2>Dossier</h2>
      <div className="form-field">
        <label htmlFor="dateNaissance">Date de naissance</label>
        <input id="dateNaissance" name="dateNaissance" type="date" defaultValue={versDateInput(coursier?.dateNaissance ?? null)} />
      </div>
      <div className="form-field">
        <label>Type de contrat</label>
        <SearchableSelect
          options={TYPES_CONTRAT.map((t) => ({ value: t, label: LIBELLE_TYPE_CONTRAT[t] }))}
          value={typeContrat}
          onChange={setTypeContrat}
          placeholder="—"
        />
      </div>
      <div className="form-field">
        <label htmlFor="dateEmbauche">Date d&apos;embauche</label>
        <input id="dateEmbauche" name="dateEmbauche" type="date" defaultValue={versDateInput(coursier?.dateEmbauche ?? null)} />
      </div>

      <h2>Contact d&apos;urgence</h2>
      <div className="form-field">
        <label htmlFor="contactUrgenceNom">Nom</label>
        <input id="contactUrgenceNom" name="contactUrgenceNom" defaultValue={coursier?.contactUrgenceNom ?? undefined} />
      </div>
      <div className="form-field">
        <label htmlFor="contactUrgenceTelephone">Téléphone</label>
        <input
          id="contactUrgenceTelephone"
          name="contactUrgenceTelephone"
          defaultValue={coursier?.contactUrgenceTelephone ?? undefined}
        />
      </div>

      <h2>Affectation</h2>
      {!modification && (
        <>
          <div className="form-field">
            <label>Entreprise *</label>
            <SearchableSelect
              options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
              value={entrepriseId}
              onChange={(v) => {
                setEntrepriseId(v);
                setSiteId("");
                setProfilHoraireId("");
              }}
              placeholder="Sélectionner une entreprise…"
            />
          </div>
          <div className="form-field">
            <label>Site *</label>
            <SearchableSelect
              options={sitesFiltres.map((s) => ({ value: s.id, label: s.nom }))}
              value={siteId}
              onChange={setSiteId}
              placeholder={entrepriseId ? "Sélectionner un site…" : "Choisissez d'abord une entreprise"}
              disabled={!entrepriseId}
            />
          </div>
        </>
      )}
      <div className="form-field">
        <label>Profil horaire *</label>
        <SearchableSelect
          options={profilsFiltres.map((p) => ({ value: p.id, label: `${p.nom} (${libelleHoraires(p.horaires)})` }))}
          value={profilHoraireId}
          onChange={setProfilHoraireId}
          placeholder="Sélectionner un profil horaire…"
        />
      </div>

      <div className="form-field">
        <label htmlFor="notes">Notes internes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={coursier?.notes ?? undefined} />
      </div>

      {erreur && <p className="form-error">{erreur}</p>}

      <button type="submit" className="btn btn-primary" disabled={enCours} style={{ marginTop: "1rem" }}>
        {enCours ? "Enregistrement…" : modification ? "Enregistrer les modifications" : "Créer le coursier"}
      </button>
    </form>
  );
}
