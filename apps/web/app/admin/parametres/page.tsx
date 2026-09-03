"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";
import { Entreprise } from "@/lib/types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { LIBELLE_ROLE } from "@/lib/roles";

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

interface CodeBorne {
  id: string;
  nom: string;
  role: "GARDIEN" | "CONSULTATION" | "ADMIN";
  utilisateur: { id: string; nomComplet: string; role: string } | null;
  actif: boolean;
  appareilLie: boolean;
  lieLe: string | null;
}

interface CompteResume {
  id: string;
  nomComplet: string;
  role: string;
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
  const [codesBorne, setCodesBorne] = useState<CodeBorne[] | null>(null);
  const [comptesDisponibles, setComptesDisponibles] = useState<CompteResume[]>([]);
  const [ongletNouveauCode, setOngletNouveauCode] = useState<"GARDIEN" | "CONSULTATION">("GARDIEN");
  const [nomNouveauCode, setNomNouveauCode] = useState("");
  const [compteSelectionne, setCompteSelectionne] = useState("");
  const [codeGenere, setCodeGenere] = useState<{ nom: string; code: string } | null>(null);
  const [actionCodeBorneEnCours, setActionCodeBorneEnCours] = useState(false);
  const [erreurCodeBorne, setErreurCodeBorne] = useState<string | null>(null);

  function chargerCodesBorne() {
    api.get<CodeBorne[]>("/api/parametres/codes-borne").then(setCodesBorne);
  }

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then((liste) => {
      setEntreprises(liste);
      setEntrepriseId(liste[0]?.id ?? "");
    });
    if (!estSuperAdmin) return;
    api.get<ConfigurationAccueil>("/api/parametres/accueil").then(setConfigurationAccueil);
    api.get<Terminal[]>("/api/terminaux").then(setTerminaux);
    api.get<CompteResume[]>("/api/utilisateurs").then(setComptesDisponibles);
    chargerCodesBorne();
  }, [estSuperAdmin]);

  async function ajouterCodeGardien(e: FormEvent) {
    e.preventDefault();
    if (!nomNouveauCode.trim()) return;
    setActionCodeBorneEnCours(true);
    setErreurCodeBorne(null);
    try {
      const cree = await api.post<{ nom: string; code: string }>("/api/parametres/codes-borne", { nom: nomNouveauCode });
      setCodeGenere({ nom: cree.nom, code: cree.code });
      setNomNouveauCode("");
      chargerCodesBorne();
    } catch (err) {
      setErreurCodeBorne(err instanceof ApiError ? err.message : "Échec de la création du code");
    } finally {
      setActionCodeBorneEnCours(false);
    }
  }

  async function ajouterCodeConsultation(e: FormEvent) {
    e.preventDefault();
    if (!compteSelectionne) return;
    setActionCodeBorneEnCours(true);
    setErreurCodeBorne(null);
    try {
      const cree = await api.post<{ nom: string; code: string }>("/api/parametres/codes-borne/consultation", {
        utilisateurId: compteSelectionne,
      });
      setCodeGenere({ nom: cree.nom, code: cree.code });
      setCompteSelectionne("");
      chargerCodesBorne();
    } catch (err) {
      setErreurCodeBorne(err instanceof ApiError ? err.message : "Échec de la création du code");
    } finally {
      setActionCodeBorneEnCours(false);
    }
  }

  async function basculerActivationCodeBorne(id: string, actif: boolean) {
    setActionCodeBorneEnCours(true);
    setErreurCodeBorne(null);
    try {
      setCodesBorne(await api.patch<CodeBorne[]>(`/api/parametres/codes-borne/${id}/actif`, { actif }));
    } catch (err) {
      setErreurCodeBorne(err instanceof ApiError ? err.message : "Échec de l'opération");
    } finally {
      setActionCodeBorneEnCours(false);
    }
  }

  async function delierCodeBorne(id: string) {
    setActionCodeBorneEnCours(true);
    setErreurCodeBorne(null);
    try {
      setCodesBorne(await api.post<CodeBorne[]>(`/api/parametres/codes-borne/${id}/delier`));
    } catch (err) {
      setErreurCodeBorne(err instanceof ApiError ? err.message : "Échec de l'opération");
    } finally {
      setActionCodeBorneEnCours(false);
    }
  }

  async function supprimerCodeBorne(c: CodeBorne) {
    if (!window.confirm(`Supprimer définitivement le code "${c.nom}" ? Cette action est irréversible.`)) return;
    setActionCodeBorneEnCours(true);
    setErreurCodeBorne(null);
    try {
      setCodesBorne(await api.delete<CodeBorne[]>(`/api/parametres/codes-borne/${c.id}`));
    } catch (err) {
      setErreurCodeBorne(err instanceof ApiError ? err.message : "Échec de la suppression");
    } finally {
      setActionCodeBorneEnCours(false);
    }
  }

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

      {estSuperAdmin && codesBorne && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.05rem" }}>
            Codes d'accès de la borne{" "}
            <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              ({codesBorne.filter((c) => c.actif).length} actif{codesBorne.filter((c) => c.actif).length !== 1 ? "s" : ""} sur {codesBorne.length})
            </span>
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
            Seule une personne connaissant un code actif peut changer l'état d'un coursier à la borne. Chaque code
            reste valable indéfiniment jusqu'à ce que vous le désactiviez.
          </p>

          {codeGenere && (
            <div className="alert-banner info" style={{ margin: "0 0 1rem" }}>
              Nouveau code pour <strong>{codeGenere.nom}</strong> :{" "}
              <strong style={{ fontSize: "1.2rem", letterSpacing: "0.2em" }}>{codeGenere.code}</strong>
              <br />
              À communiquer maintenant à la personne autorisée — il ne sera plus jamais affiché.
            </div>
          )}

          {codesBorne.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {codesBorne.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.65rem 0.9rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{c.nom}</strong>{" "}
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color:
                          c.role === "ADMIN" ? "var(--color-accent)" : c.role === "GARDIEN" ? "var(--color-primary)" : "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {c.role === "ADMIN" ? "Accès complet" : c.role === "GARDIEN" ? "Gardien" : "Consultation"}
                    </span>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {c.actif ? "Actif" : "Désactivé"}
                      {c.appareilLie && (
                        <>
                          {" "}
                          · lié à un appareil
                          {c.lieLe && ` depuis le ${new Date(c.lieLe).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}`}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-text"
                      disabled={actionCodeBorneEnCours}
                      onClick={() => basculerActivationCodeBorne(c.id, !c.actif)}
                    >
                      {c.actif ? "Désactiver" : "Réactiver"}
                    </button>
                    {c.appareilLie && (
                      <button type="button" className="btn-text" disabled={actionCodeBorneEnCours} onClick={() => delierCodeBorne(c.id)}>
                        Délier
                      </button>
                    )}
                    <button type="button" className="btn-text" disabled={actionCodeBorneEnCours} onClick={() => supprimerCodeBorne(c)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "1.25rem", borderBottom: "1px solid var(--color-border)", marginBottom: "0.9rem" }}>
            <button
              type="button"
              onClick={() => setOngletNouveauCode("GARDIEN")}
              style={{
                background: "none",
                padding: "0 0 0.5rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: ongletNouveauCode === "GARDIEN" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: ongletNouveauCode === "GARDIEN" ? "2px solid var(--color-primary)" : "2px solid transparent",
              }}
            >
              Gardien
            </button>
            <button
              type="button"
              onClick={() => setOngletNouveauCode("CONSULTATION")}
              style={{
                background: "none",
                padding: "0 0 0.5rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: ongletNouveauCode === "CONSULTATION" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: ongletNouveauCode === "CONSULTATION" ? "2px solid var(--color-primary)" : "2px solid transparent",
              }}
            >
              Compte existant
            </button>
          </div>

          {ongletNouveauCode === "GARDIEN" ? (
            <form onSubmit={ajouterCodeGardien} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="form-field" style={{ marginBottom: 0, flex: "1 1 12rem" }}>
                <label htmlFor="nomNouveauCode">Nom (ex: Gardien siège)</label>
                <input id="nomNouveauCode" value={nomNouveauCode} onChange={(e) => setNomNouveauCode(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={actionCodeBorneEnCours || !nomNouveauCode.trim()}>
                + Ajouter un code
              </button>
            </form>
          ) : (
            <form onSubmit={ajouterCodeConsultation} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="form-field" style={{ marginBottom: 0, flex: "1 1 14rem" }}>
                <label htmlFor="compteSelectionne">Compte</label>
                <select id="compteSelectionne" value={compteSelectionne} onChange={(e) => setCompteSelectionne(e.target.value)}>
                  <option value="">Sélectionner un compte…</option>
                  {comptesDisponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomComplet} — {LIBELLE_ROLE[c.role as keyof typeof LIBELLE_ROLE] ?? c.role}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-secondary" disabled={actionCodeBorneEnCours || !compteSelectionne}>
                + Générer son code
              </button>
            </form>
          )}
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.4rem 0 0" }}>
            {ongletNouveauCode === "GARDIEN"
              ? "Peut changer l'état des coursiers et démarrer/fermer la journée."
              : "Lecture seule : consulte l'historique d'un coursier, ne peut rien modifier. Le titulaire retrouve son code dans son profil. Exception : un compte Super Admin reçoit automatiquement l'accès complet (gardien + consultation)."}
          </p>

          {erreurCodeBorne && <p className="form-error">{erreurCodeBorne}</p>}
        </div>
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
