"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Horaires, JourSemaine, ProfilHoraire } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/ToastProvider";

const JOURS: { code: JourSemaine; libelle: string }[] = [
  { code: "LUN", libelle: "Lundi" },
  { code: "MAR", libelle: "Mardi" },
  { code: "MER", libelle: "Mercredi" },
  { code: "JEU", libelle: "Jeudi" },
  { code: "VEN", libelle: "Vendredi" },
  { code: "SAM", libelle: "Samedi" },
  { code: "DIM", libelle: "Dimanche" },
];

const HORAIRES_PAR_DEFAUT: Horaires = {
  LUN: { debut: "08:00", fin: "17:30" },
  MAR: { debut: "08:00", fin: "17:30" },
  MER: { debut: "08:00", fin: "17:30" },
  JEU: { debut: "08:00", fin: "17:30" },
  VEN: { debut: "08:00", fin: "17:30" },
};

export function libelleHoraires(horaires: Horaires): string {
  const jours = JOURS.filter((j) => horaires[j.code]);
  if (jours.length === 0) return "Aucun jour travaillé";
  const plages = new Map<string, string[]>();
  for (const j of jours) {
    const p = horaires[j.code]!;
    const cle = `${p.debut}–${p.fin}`;
    plages.set(cle, [...(plages.get(cle) ?? []), j.libelle.slice(0, 3)]);
  }
  return [...plages.entries()].map(([plage, joursLibelle]) => `${joursLibelle.join(", ")} ${plage}`).join(" · ");
}

export function ProfilsHorairesModal({
  entrepriseId,
  entrepriseNom,
  onClose,
}: {
  entrepriseId: string;
  entrepriseNom: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [profils, setProfils] = useState<ProfilHoraire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [profilEnEdition, setProfilEnEdition] = useState<ProfilHoraire | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [horaires, setHoraires] = useState<Horaires>(HORAIRES_PAR_DEFAUT);
  const [estParDefaut, setEstParDefaut] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function recharger() {
    setChargement(true);
    try {
      setProfils(await api.get<ProfilHoraire[]>(`/api/profils-horaires?entrepriseId=${entrepriseId}`));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    recharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrepriseId]);

  function ouvrirCreation() {
    setProfilEnEdition(null);
    setNom("");
    setHoraires(HORAIRES_PAR_DEFAUT);
    setEstParDefaut(profils.length === 0);
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(p: ProfilHoraire) {
    setProfilEnEdition(p);
    setNom(p.nom);
    setHoraires(p.horaires);
    setEstParDefaut(p.estParDefaut);
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function basculerJour(jour: JourSemaine, actif: boolean) {
    setHoraires((h) => {
      const copie = { ...h };
      if (actif) copie[jour] = copie[jour] ?? { debut: "08:00", fin: "17:30" };
      else delete copie[jour];
      return copie;
    });
  }

  function modifierHeure(jour: JourSemaine, champ: "debut" | "fin", valeur: string) {
    setHoraires((h) => ({ ...h, [jour]: { ...(h[jour] ?? { debut: "08:00", fin: "17:30" }), [champ]: valeur } }));
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    if (Object.keys(horaires).length === 0) {
      setErreur("Sélectionnez au moins un jour travaillé");
      return;
    }
    setEnCours(true);
    try {
      if (profilEnEdition) {
        await api.patch(`/api/profils-horaires/${profilEnEdition.id}`, { nom, horaires, estParDefaut });
        showToast("Horaires modifiés avec succès");
      } else {
        await api.post("/api/profils-horaires", { nom, horaires, estParDefaut, entrepriseId });
        showToast("Profil horaire créé avec succès");
      }
      setFormulaireOuvert(false);
      recharger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActivation(p: ProfilHoraire) {
    await api.patch(`/api/profils-horaires/${p.id}`, { actif: !p.actif });
    showToast(p.actif ? "Profil désactivé" : "Profil réactivé");
    recharger();
  }

  return (
    <Modal titre={`Horaires · ${entrepriseNom}`} onClose={onClose} maxWidth="34rem">
      {!formulaireOuvert && (
        <>
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation} style={{ marginBottom: "1rem" }}>
            + Ajouter un profil horaire
          </button>

          {chargement && <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>}

          {!chargement && profils.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>Aucun profil horaire pour cette entreprise.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {profils.map((p) => (
              <div key={p.id} className="card" style={{ padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <div>
                    <strong>{p.nom}</strong>
                    {p.estParDefaut && <span className="badge badge-disponible" style={{ marginLeft: "0.5rem" }}>Par défaut</span>}
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{libelleHoraires(p.horaires)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(p)}>
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formulaireOuvert && (
        <form onSubmit={enregistrer}>
          <div className="form-field">
            <label htmlFor="phNom">Nom *</label>
            <input id="phNom" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Journée complète" />
          </div>

          <div className="form-field">
            <label>Jours et horaires *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {JOURS.map((j) => {
                const plage = horaires[j.code];
                const actif = !!plage;
                return (
                  <div
                    key={j.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.6rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      background: actif ? "var(--color-surface)" : "transparent",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: "7rem", marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        style={{ width: "auto", minHeight: "auto" }}
                        checked={actif}
                        onChange={(e) => basculerJour(j.code, e.target.checked)}
                      />
                      {j.libelle}
                    </label>
                    {actif && (
                      <>
                        <input
                          type="time"
                          value={plage.debut}
                          onChange={(e) => modifierHeure(j.code, "debut", e.target.value)}
                          style={{ minHeight: "auto", padding: "0.3rem 0.5rem" }}
                        />
                        <span style={{ color: "var(--color-text-muted)" }}>–</span>
                        <input
                          type="time"
                          value={plage.fin}
                          onChange={(e) => modifierHeure(j.code, "fin", e.target.value)}
                          style={{ minHeight: "auto", padding: "0.3rem 0.5rem" }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="phDefaut"
              type="checkbox"
              style={{ width: "auto", minHeight: "auto" }}
              checked={estParDefaut}
              onChange={(e) => setEstParDefaut(e.target.checked)}
            />
            <label htmlFor="phDefaut" style={{ marginBottom: 0 }}>
              Profil par défaut
            </label>
          </div>

          {profilEnEdition && (
            <button
              type="button"
              className="btn-text"
              style={{ marginBottom: "0.75rem" }}
              onClick={() => basculerActivation(profilEnEdition)}
            >
              {profilEnEdition.actif ? "Désactiver ce profil" : "Réactiver ce profil"}
            </button>
          )}

          {erreur && <p className="form-error">{erreur}</p>}

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Enregistrement…" : profilEnEdition ? "Enregistrer les modifications" : "Créer"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormulaireOuvert(false)}>
              Retour à la liste
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
