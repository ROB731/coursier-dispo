"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Entreprise } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";

export default function EntreprisesPage() {
  const { showToast } = useToast();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [entrepriseEnEdition, setEntrepriseEnEdition] = useState<Entreprise | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function recharger() {
    setEntreprises(await api.get<Entreprise[]>("/api/entreprises"));
  }

  useEffect(() => {
    recharger();
  }, []);

  function ouvrirCreation() {
    setEntrepriseEnEdition(null);
    setErreur(null);
    setModalOuvert(true);
  }

  function ouvrirEdition(e: Entreprise) {
    setEntrepriseEnEdition(e);
    setErreur(null);
    setModalOuvert(true);
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const form = new FormData(e.currentTarget);
    const payload = { nom: form.get("nom") as string };
    try {
      if (entrepriseEnEdition) {
        await api.patch(`/api/entreprises/${entrepriseEnEdition.id}`, payload);
        showToast("Entreprise modifiée avec succès");
      } else {
        await api.post("/api/entreprises", payload);
        showToast("Entreprise créée avec succès");
      }
      setModalOuvert(false);
      recharger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActivation(e: Entreprise) {
    await api.patch(`/api/entreprises/${e.id}`, { actif: !e.actif });
    showToast(e.actif ? "Entreprise désactivée" : "Entreprise réactivée");
    recharger();
  }

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>
            Entreprises <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({entreprises.length})</span>
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            Les entreprises clientes de la plateforme — chacune avec ses propres sites, coursiers et comptes, totalement isolés.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
          + Ajouter une entreprise
        </button>
      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {entreprises.map((e) => (
          <div key={e.id} className="card list-row">
            <div className="list-row-info">
              <strong>{e.nom}</strong>
            </div>
            <div className="list-row-actions">
              <span className={`badge ${e.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                {e.actif ? "Active" : "Désactivée"}
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(e)}>
                Modifier
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(e)}>
                {e.actif ? "Désactiver" : "Réactiver"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOuvert && (
        <Modal titre={entrepriseEnEdition ? "Modifier l'entreprise" : "Nouvelle entreprise"} onClose={() => setModalOuvert(false)} maxWidth="24rem">
          <form onSubmit={enregistrer}>
            <div className="form-field">
              <label htmlFor="nom">Nom de l&apos;entreprise *</label>
              <input id="nom" name="nom" required placeholder="Ex. IVOIRRAPID" defaultValue={entrepriseEnEdition?.nom} />
            </div>
            {erreur && <p className="form-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Enregistrement…" : entrepriseEnEdition ? "Enregistrer les modifications" : "Créer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
