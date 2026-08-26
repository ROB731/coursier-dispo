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

interface ConfigurationAccueil {
  pageAccueil: "CONNEXION" | "BORNE";
  terminalAccueilId: string | null;
  notificationsBorneActives: boolean;
}

interface Terminal {
  id: string;
  nom: string;
  actif: boolean;
  site: { nom: string };
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
  const [configurationAccueil, setConfigurationAccueil] = useState<ConfigurationAccueil | null>(null);
  const [terminaux, setTerminaux] = useState<Terminal[]>([]);
  const [enregistrementAccueil, setEnregistrementAccueil] = useState(false);

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then((liste) => {
      setEntreprises(liste);
      setEntrepriseId(liste[0]?.id ?? "");
    });
    if (!estSuperAdmin) return;
    api.get<ConfigurationAccueil>("/api/parametres/accueil").then(setConfigurationAccueil);
    api.get<Terminal[]>("/api/terminaux").then(setTerminaux);
  }, [estSuperAdmin]);

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

  async function enregistrerAccueil(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configurationAccueil) return;
    setEnregistrementAccueil(true);
    setErreur(null);
    const form = new FormData(e.currentTarget);
    const pageAccueil = form.get("pageAccueil") as ConfigurationAccueil["pageAccueil"];
    const terminalAccueilId = (form.get("terminalAccueilId") as string) || null;
    try {
      const mis = await api.patch<ConfigurationAccueil>("/api/parametres/accueil", {
        pageAccueil,
        terminalAccueilId,
        notificationsBorneActives: form.get("notificationsBorneActives") === "on",
      });
      setConfigurationAccueil(mis);
      showToast("Page d'accueil enregistrée");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement de la page d'accueil");
    } finally {
      setEnregistrementAccueil(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: "30rem" }}>
      <h1>Paramètres</h1>

      {estSuperAdmin && configurationAccueil && (
        <form onSubmit={enregistrerAccueil} style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.05rem" }}>Page d'accueil par défaut</h2>
          <div className="form-field">
            <label htmlFor="pageAccueil">Page affichée à l'ouverture du site</label>
            <select id="pageAccueil" name="pageAccueil" defaultValue={configurationAccueil.pageAccueil}>
              <option value="CONNEXION">Page de connexion</option>
              <option value="BORNE">Une borne</option>
            </select>
          </div>
          <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="notificationsBorneActives"
              name="notificationsBorneActives"
              type="checkbox"
              style={{ width: "auto", minHeight: "auto" }}
              defaultChecked={configurationAccueil.notificationsBorneActives}
            />
            <label htmlFor="notificationsBorneActives" style={{ marginBottom: 0 }}>
              Autoriser les notifications sur les bornes
            </label>
          </div>
          <div className="form-field">
            <label htmlFor="terminalAccueilId">Borne d'accueil</label>
            <select
              id="terminalAccueilId"
              name="terminalAccueilId"
              defaultValue={configurationAccueil.terminalAccueilId ?? ""}
            >
              <option value="">Sélectionner une borne…</option>
              {terminaux
                .filter((terminal) => terminal.actif)
                .map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.nom} — {terminal.site.nom}
                  </option>
                ))}
            </select>
          </div>
          {erreur && <p className="form-error">{erreur}</p>}
          <button type="submit" className="btn btn-primary" disabled={enregistrementAccueil}>
            {enregistrementAccueil ? "Enregistrement…" : "Enregistrer la page d'accueil"}
          </button>
        </form>
      )}

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
