"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/apiClient";
import { Site } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { useVueListe } from "@/lib/useVueListe";
import { ViewToggle } from "@/components/ViewToggle";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";

interface Terminal {
  id: string;
  nom: string;
  actif: boolean;
  site: Site;
}

export default function BornesPage() {
  const { showToast } = useToast();
  const { vue, setVue } = useVueListe();
  const [bornes, setBornes] = useState<Terminal[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [borneEnEdition, setBorneEnEdition] = useState<Terminal | null>(null);
  const [siteId, setSiteId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [lienCopie, setLienCopie] = useState<string | null>(null);

  async function recharger() {
    setBornes(await api.get<Terminal[]>("/api/terminaux"));
  }

  useEffect(() => {
    recharger();
    api.get<Site[]>("/api/sites").then(setSites);
  }, []);

  function ouvrirCreation() {
    setBorneEnEdition(null);
    setSiteId("");
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(b: Terminal) {
    setBorneEnEdition(b);
    setSiteId(b.site.id);
    setErreur(null);
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setBorneEnEdition(null);
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    if (!siteId) {
      setErreur("Sélectionnez un site");
      return;
    }
    setEnCours(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      nom: form.get("nom"),
      siteId,
    };
    try {
      if (borneEnEdition) {
        await api.patch(`/api/terminaux/${borneEnEdition.id}`, payload);
        showToast("Point modifié avec succès");
      } else {
        await api.post("/api/terminaux", payload);
        showToast("Point créé avec succès");
      }
      fermerFormulaire();
      recharger();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActivation(b: Terminal) {
    await api.patch(`/api/terminaux/${b.id}`, { actif: !b.actif });
    showToast(b.actif ? "Point désactivé" : "Point réactivé");
    recharger();
  }

  function copierLien(id: string) {
    const url = `${window.location.origin}/borne/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLienCopie(id);
      setTimeout(() => setLienCopie(null), 2000);
    });
  }

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(bornes);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          À la porte {bornes.length > 0 && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({bornes.length})</span>}
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter
          </button>
        </div>
      </div>

      {formulaireOuvert && (
        <Modal titre={borneEnEdition ? "Modifier le point" : "Nouveau point « À la porte »"} onClose={fermerFormulaire} maxWidth="26.25rem">
          <form onSubmit={enregistrer}>
            <div className="form-field">
              <label htmlFor="nom">Nom *</label>
              <input id="nom" name="nom" required placeholder="Ex. À la porte" defaultValue={borneEnEdition?.nom ?? "À la porte"} />
            </div>
            <div className="form-field">
              <label>Site *</label>
              <SearchableSelect
                options={sites.map((s) => ({ value: s.id, label: s.nom }))}
                value={siteId}
                onChange={setSiteId}
                placeholder="Sélectionner un site…"
              />
            </div>
            {erreur && <p className="form-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={enCours}>
              {enCours ? "Enregistrement…" : borneEnEdition ? "Enregistrer les modifications" : "Créer"}
            </button>
          </form>
        </Modal>
      )}

      {bornes.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", marginTop: "1.5rem" }}>Aucun point « À la porte » configuré.</p>
      )}

      {bornes.length > 0 && vue === "cartes" && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pageItems.map((b) => (
            <div key={b.id} className="card" style={{ padding: "0.75rem 1rem" }}>
              <div className="list-row" style={{ padding: 0 }}>
                <div className="list-row-info">
                  <strong>{b.nom}</strong>
                  <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{b.site.nom}</span>
                </div>
                <div className="list-row-actions">
                  <span className={`badge ${b.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                    {b.actif ? "Active" : "Désactivée"}
                  </span>
                  <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(b)}>
                    Modifier
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(b)}>
                    {b.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href={`/borne/${b.id}`} target="_blank" className="link" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Ouvrir →
                </Link>
                <button type="button" className="btn-text" onClick={() => copierLien(b.id)}>
                  {lienCopie === b.id ? "Lien copié ✓" : "Copier le lien"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bornes.length > 0 && vue === "tableau" && (
        <div className="table-wrap table-wrap-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Site</th>
                <th>Statut</th>
                <th>Lien</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((b, index) => (
                <tr key={b.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td>{b.nom}</td>
                  <td>{b.site.nom}</td>
                  <td>
                    <span className={`badge ${b.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                      {b.actif ? "Active" : "Désactivée"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Link href={`/borne/${b.id}`} target="_blank" className="link" style={{ fontWeight: 600 }}>
                        Ouvrir →
                      </Link>
                      <button type="button" className="btn-text" onClick={() => copierLien(b.id)}>
                        {lienCopie === b.id ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(b)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(b)}>
                        {b.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} nbPages={nbPages} onChange={setPage} />
    </div>
  );
}
