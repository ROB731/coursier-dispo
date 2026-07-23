"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { Entreprise } from "@/lib/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useUtilisateur } from "@/lib/useUtilisateur";

interface Parametres {
  modeMultiSite: boolean;
  fenetreAnnulationBorneMinutes: number;
  intervallePollingSecondes: number;
  clotureAutoActive: boolean;
}

export default function ParametresPage() {
  const { showToast } = useToast();
  const { utilisateur } = useUtilisateur();
  const estSuperAdmin = utilisateur?.role === "SUPER_ADMIN";
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then((liste) => {
      setEntreprises(liste);
      setEntrepriseId(liste[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!entrepriseId) return;
    setParametres(null);
    api.get<Parametres>(`/api/parametres?entrepriseId=${entrepriseId}`).then(setParametres);
  }, [entrepriseId]);

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const form = new FormData(e.currentTarget);
    try {
      const mis = await api.patch<Parametres>("/api/parametres", {
        entrepriseId,
        ...(estSuperAdmin ? { modeMultiSite: form.get("modeMultiSite") === "on" } : {}),
        clotureAutoActive: form.get("clotureAutoActive") === "on",
        fenetreAnnulationBorneMinutes: Number(form.get("fenetreAnnulationBorneMinutes")),
        intervallePollingSecondes: Number(form.get("intervallePollingSecondes")),
      });
      setParametres(mis);
      showToast("Paramètres enregistrés avec succès");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: "30rem" }}>
      <h1>Paramètres</h1>

      {entreprises.length > 1 && (
        <div className="form-field">
          <label>Entreprise</label>
          <SearchableSelect
            options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
            value={entrepriseId}
            onChange={setEntrepriseId}
          />
        </div>
      )}

      {parametres && (
        <form onSubmit={enregistrer} key={entrepriseId}>
          {estSuperAdmin ? (
            <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="modeMultiSite"
                name="modeMultiSite"
                type="checkbox"
                style={{ width: "auto", minHeight: "auto" }}
                defaultChecked={parametres.modeMultiSite}
              />
              <label htmlFor="modeMultiSite" style={{ marginBottom: 0 }}>
                Mode multi-site
              </label>
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Mode multi-site : {parametres.modeMultiSite ? "accordé" : "non accordé"} par le Super Administrateur.
            </p>
          )}

          <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="clotureAutoActive"
              name="clotureAutoActive"
              type="checkbox"
              style={{ width: "auto", minHeight: "auto" }}
              defaultChecked={parametres.clotureAutoActive}
            />
            <label htmlFor="clotureAutoActive" style={{ marginBottom: 0 }}>
              Clôture automatique de fin de journée
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="fenetreAnnulationBorneMinutes">Fenêtre de correction à la porte (minutes)</label>
            <input
              id="fenetreAnnulationBorneMinutes"
              name="fenetreAnnulationBorneMinutes"
              type="number"
              min={1}
              defaultValue={parametres.fenetreAnnulationBorneMinutes}
            />
          </div>

          <div className="form-field">
            <label htmlFor="intervallePollingSecondes">Fréquence de rafraîchissement du tableau de bord (secondes)</label>
            <input
              id="intervallePollingSecondes"
              name="intervallePollingSecondes"
              type="number"
              min={1}
              defaultValue={parametres.intervallePollingSecondes}
            />
          </div>

          {erreur && <p className="form-error">{erreur}</p>}

          <button type="submit" className="btn btn-primary" disabled={enCours}>
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );
}
