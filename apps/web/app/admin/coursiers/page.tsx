"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { Coursier } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { useVueListe } from "@/lib/useVueListe";
import { ViewToggle } from "@/components/ViewToggle";
import { Modal } from "@/components/Modal";
import { CoursierForm } from "@/components/CoursierForm";
import { CoursierDetailModal } from "@/components/CoursierDetailModal";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { ApiError } from "@/lib/apiClient";

export default function ListeCoursiersPage() {
  const { showToast } = useToast();
  const { utilisateur } = useUtilisateur();
  const { vue, setVue } = useVueListe();
  const [coursiers, setCoursiers] = useState<Coursier[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [coursierEnEdition, setCoursierEnEdition] = useState<Coursier | null>(null);
  const [coursierAffiche, setCoursierAffiche] = useState<Coursier | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"TOUS" | "ACTIFS" | "DESACTIVES">("TOUS");

  async function recharger() {
    setCoursiers(await api.get<Coursier[]>("/api/coursiers"));
  }

  useEffect(() => {
    recharger();
  }, []);

  async function basculerActivation(c: Coursier) {
    const action = c.statutActif ? "desactiver" : "reactiver";
    await api.post(`/api/coursiers/${c.id}/${action}`);
    showToast(c.statutActif ? "Coursier désactivé" : "Coursier réactivé");
    recharger();
  }

  async function supprimer(c: Coursier) {
    const nomComplet = `${c.prenom} ${c.nom}`.trim();
    if (!window.confirm(`Supprimer définitivement ${nomComplet} (${c.code}) ? Cette action est irréversible.`)) return;

    try {
      await api.delete(`/api/coursiers/${c.id}`);
      showToast("Coursier supprimé");
      await recharger();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer le coursier");
    }
  }

  function ouvrirCreation() {
    setCoursierEnEdition(null);
    setModalOuvert(true);
  }

  function ouvrirEdition(c: Coursier) {
    setCoursierEnEdition(c);
    setModalOuvert(true);
  }

  function surSucces() {
    setModalOuvert(false);
    recharger();
  }

  const coursiersFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return coursiers.filter((coursier) => {
      const correspondRecherche = !terme || `${coursier.prenom} ${coursier.nom} ${coursier.code}`.toLowerCase().includes(terme);
      const correspondStatut = filtreStatut === "TOUS" || (filtreStatut === "ACTIFS" ? coursier.statutActif : !coursier.statutActif);
      return correspondRecherche && correspondStatut;
    });
  }, [coursiers, recherche, filtreStatut]);

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(coursiersFiltres);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Coursiers <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({coursiersFiltres.length})</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter un coursier
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(14rem, 1fr) minmax(11rem, 14rem)",
          gap: "0.6rem",
          marginTop: "1rem",
        }}
      >
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou code…"
          aria-label="Rechercher un coursier par nom ou code"
        />
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value as typeof filtreStatut)} aria-label="Filtrer les coursiers par statut">
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIFS">Actifs uniquement</option>
          <option value="DESACTIVES">Désactivés uniquement</option>
        </select>
      </div>

      {coursiers.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", marginTop: "1.5rem" }}>Aucun coursier enregistré.</p>
      )}

      {coursiers.length > 0 && coursiersFiltres.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", marginTop: "1.5rem" }}>Aucun coursier ne correspond à ces filtres.</p>
      )}

      {coursiersFiltres.length > 0 && vue === "cartes" && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pageItems.map((c) => (
            <div key={c.id} className="card list-row">
              <img src={c.photoUrl} alt="" className="list-avatar" />
              <div className="list-row-info">
                <strong>
                  {c.prenom} {c.nom}
                </strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>{c.code}</span>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${c.statutActif ? "badge-disponible" : "badge-non-disponible"}`}>
                  {c.statutActif ? "Actif" : "Désactivé"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => setCoursierAffiche(c)}>
                  Voir
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(c)}>
                  Modifier
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(c)}>
                  {c.statutActif ? "Désactiver" : "Réactiver"}
                </button>
                {utilisateur?.role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => supprimer(c)}
                    disabled={c.statutActif}
                    title={c.statutActif ? "Désactivez d'abord le coursier" : "Supprimer définitivement le coursier"}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {coursiersFiltres.length > 0 && vue === "tableau" && (
        <div className="table-wrap table-wrap-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Nom</th>
                <th>Code</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c, index) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td>
                    <img src={c.photoUrl} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover" }} />
                  </td>
                  <td>
                    {c.prenom} {c.nom}
                  </td>
                  <td>{c.code}</td>
                  <td>
                    <span className={`badge ${c.statutActif ? "badge-disponible" : "badge-non-disponible"}`}>
                      {c.statutActif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setCoursierAffiche(c)}>
                        Voir
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(c)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(c)}>
                        {c.statutActif ? "Désactiver" : "Réactiver"}
                      </button>
                      {utilisateur?.role === "SUPER_ADMIN" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => supprimer(c)}
                          disabled={c.statutActif}
                          title={c.statutActif ? "Désactivez d'abord le coursier" : "Supprimer définitivement le coursier"}
                        >
                          Supprimer
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

      {modalOuvert && (
        <Modal
          titre={coursierEnEdition ? "Modifier le coursier" : "Nouveau coursier"}
          onClose={() => setModalOuvert(false)}
          maxWidth="35rem"
        >
          <CoursierForm coursier={coursierEnEdition ?? undefined} onSuccess={surSucces} />
        </Modal>
      )}

      {coursierAffiche && <CoursierDetailModal coursier={coursierAffiche} onClose={() => setCoursierAffiche(null)} />}
    </div>
  );
}
