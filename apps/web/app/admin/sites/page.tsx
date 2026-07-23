"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Entreprise, Site } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { useVueListe } from "@/lib/useVueListe";
import { ViewToggle } from "@/components/ViewToggle";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ProfilsHorairesModal } from "@/components/ProfilsHorairesModal";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";

export default function SitesPage() {
  const { showToast } = useToast();
  const { vue, setVue } = useVueListe();
  const [sites, setSites] = useState<Site[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [siteEnEdition, setSiteEnEdition] = useState<Site | null>(null);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [horairesEntrepriseId, setHorairesEntrepriseId] = useState<string | null>(null);

  const nomEntreprise = useMemo(() => {
    const carte = new Map(entreprises.map((e) => [e.id, e.nom]));
    return (id: string) => carte.get(id) ?? "—";
  }, [entreprises]);

  async function recharger() {
    setSites(await api.get<Site[]>("/api/sites"));
  }

  useEffect(() => {
    recharger();
    api.get<Entreprise[]>("/api/entreprises").then(setEntreprises);
  }, []);

  function ouvrirCreation() {
    setSiteEnEdition(null);
    setEntrepriseId("");
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(s: Site) {
    setSiteEnEdition(s);
    setEntrepriseId(s.entrepriseId);
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setSiteEnEdition(null);
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    if (!siteEnEdition && !entrepriseId) {
      setErreur("Sélectionnez une entreprise");
      return;
    }
    setEnCours(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      nom: form.get("nom"),
      adresse: (form.get("adresse") as string) || undefined,
      ville: (form.get("ville") as string) || undefined,
      entrepriseId,
    };
    try {
      if (siteEnEdition) {
        await api.patch(`/api/sites/${siteEnEdition.id}`, payload);
        showToast("Site modifié avec succès");
      } else {
        await api.post("/api/sites", payload);
        showToast("Site créé avec succès");
      }
      fermerFormulaire();
      recharger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActivation(s: Site) {
    await api.patch(`/api/sites/${s.id}`, { actif: !s.actif });
    showToast(s.actif ? "Site désactivé" : "Site réactivé");
    recharger();
  }

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(sites);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Sites <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({sites.length})</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter un site
          </button>
        </div>
      </div>

      {formulaireOuvert && (
        <Modal titre={siteEnEdition ? "Modifier le site" : "Nouveau site"} onClose={fermerFormulaire} maxWidth="26.25rem">
          <form onSubmit={enregistrer}>
            {!siteEnEdition && (
              <div className="form-field">
                <label>Entreprise *</label>
                <SearchableSelect
                  options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
                  value={entrepriseId}
                  onChange={setEntrepriseId}
                  placeholder="Sélectionner une entreprise…"
                />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="nom">Nom *</label>
              <input id="nom" name="nom" required placeholder="Ex. Agence Cocody" defaultValue={siteEnEdition?.nom} />
            </div>
            <div className="form-field">
              <label htmlFor="ville">Ville</label>
              <input id="ville" name="ville" defaultValue={siteEnEdition?.ville ?? undefined} />
            </div>
            <div className="form-field">
              <label htmlFor="adresse">Adresse</label>
              <input id="adresse" name="adresse" defaultValue={siteEnEdition?.adresse ?? undefined} />
            </div>
            {erreur && <p className="form-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Enregistrement…" : siteEnEdition ? "Enregistrer les modifications" : "Créer"}
            </button>
          </form>
        </Modal>
      )}

      {vue === "cartes" && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pageItems.map((s) => (
            <div key={s.id} className="card list-row">
              <div className="list-row-info">
                <strong>{s.nom}</strong>
                {s.estSitePrincipal && <span className="badge badge-disponible" style={{ marginLeft: "0.5rem" }}>Principal</span>}
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {nomEntreprise(s.entrepriseId)} · {[s.ville, s.adresse].filter(Boolean).join(" — ")}
                </div>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${s.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                  {s.actif ? "Actif" : "Désactivé"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => setHorairesEntrepriseId(s.entrepriseId)}>
                  Horaires
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(s)}>
                  Modifier
                </button>
                {!s.estSitePrincipal && (
                  <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(s)}>
                    {s.actif ? "Désactiver" : "Réactiver"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {vue === "tableau" && (
        <div className="table-wrap table-wrap-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Entreprise</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s, index) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td>
                    {s.nom} {s.estSitePrincipal && <span className="badge badge-disponible">Principal</span>}
                  </td>
                  <td>{nomEntreprise(s.entrepriseId)}</td>
                  <td>{[s.ville, s.adresse].filter(Boolean).join(" — ")}</td>
                  <td>
                    <span className={`badge ${s.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                      {s.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setHorairesEntrepriseId(s.entrepriseId)}>
                        Horaires
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(s)}>
                        Modifier
                      </button>
                      {!s.estSitePrincipal && (
                        <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(s)}>
                          {s.actif ? "Désactiver" : "Réactiver"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} nbPages={nbPages} onChange={setPage} />

      {horairesEntrepriseId && (
        <ProfilsHorairesModal
          entrepriseId={horairesEntrepriseId}
          entrepriseNom={nomEntreprise(horairesEntrepriseId)}
          onClose={() => setHorairesEntrepriseId(null)}
        />
      )}
    </div>
  );
}
