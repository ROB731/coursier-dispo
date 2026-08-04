"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { Employe, Entreprise, Site } from "@/lib/types";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { SearchableSelect } from "@/components/SearchableSelect";

export function EmployeForm({ employe, onSuccess }: { employe?: Employe; onSuccess: () => void }) {
  const { showToast } = useToast();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [entrepriseId, setEntrepriseId] = useState(employe?.entrepriseId ?? "");
  const [siteId, setSiteId] = useState(employe?.siteId ?? "");

  const modification = Boolean(employe);

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then(setEntreprises);
    api.get<Site[]>("/api/sites").then(setSites);
  }, []);

  // Un seul périmètre accessible : pas besoin de le faire choisir.
  useEffect(() => {
    if (!modification && entreprises.length === 1 && entrepriseId !== entreprises[0].id) {
      setEntrepriseId(entreprises[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entreprises]);

  const sitesFiltres = entrepriseId ? sites.filter((s) => s.entrepriseId === entrepriseId) : sites;

  useEffect(() => {
    if (!modification && sitesFiltres.length === 1 && siteId !== sitesFiltres[0].id) {
      setSiteId(sitesFiltres[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitesFiltres]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);

    const form = new FormData(e.currentTarget);
    const valeur = (nom: string) => (form.get(nom) as string) || undefined;

    if (!modification && !entrepriseId) {
      setErreur("Sélectionnez l'entreprise de l'employé");
      return;
    }

    setEnCours(true);
    const payload = {
      prenom: valeur("prenom"),
      nom: valeur("nom"),
      poste: valeur("poste"),
      telephone: valeur("telephone"),
      email: valeur("email"),
      photoUrl: valeur("photoUrl"),
      siteId: siteId || undefined,
    };

    try {
      if (modification && employe) {
        await api.patch(`/api/employes/${employe.id}`, payload);
        showToast("Employé modifié avec succès");
      } else {
        await api.post("/api/employes", { ...payload, entrepriseId });
        showToast("Employé enregistré avec succès");
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
      <PhotoUploadField valeurInitiale={employe?.photoUrl ?? undefined} />

      <div className="form-field">
        <label htmlFor="prenom">Prénom *</label>
        <input id="prenom" name="prenom" required defaultValue={employe?.prenom} />
      </div>
      <div className="form-field">
        <label htmlFor="nom">Nom *</label>
        <input id="nom" name="nom" required defaultValue={employe?.nom} />
      </div>
      <div className="form-field">
        <label htmlFor="poste">Poste</label>
        <input id="poste" name="poste" placeholder="Ex. Comptable, Assistante RH…" defaultValue={employe?.poste ?? undefined} />
      </div>
      <div className="form-field">
        <label htmlFor="telephone">Téléphone</label>
        <input id="telephone" name="telephone" defaultValue={employe?.telephone ?? undefined} />
      </div>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={employe?.email ?? undefined} />
      </div>

      {!modification && (
        <>
          {entreprises.length !== 1 && (
            <div className="form-field">
              <label>Entreprise *</label>
              <SearchableSelect
                options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
                value={entrepriseId}
                onChange={(v) => {
                  setEntrepriseId(v);
                  setSiteId("");
                }}
                placeholder="Sélectionner une entreprise…"
              />
            </div>
          )}
          {sitesFiltres.length !== 1 && (
            <div className="form-field">
              <label>Site</label>
              <SearchableSelect
                options={sitesFiltres.map((s) => ({ value: s.id, label: s.nom }))}
                value={siteId}
                onChange={setSiteId}
                placeholder={entrepriseId ? "Sélectionner un site…" : "Choisissez d'abord une entreprise"}
                disabled={!entrepriseId}
              />
            </div>
          )}
        </>
      )}

      {erreur && <p className="form-error">{erreur}</p>}

      <button type="submit" className="btn btn-primary" disabled={enCours} style={{ marginTop: "1rem" }}>
        {enCours ? "Enregistrement…" : modification ? "Enregistrer les modifications" : "Créer l'employé"}
      </button>
    </form>
  );
}
