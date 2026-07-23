"use client";

import { useEffect, useState } from "react";
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

export default function ListeCoursiersPage() {
  const { showToast } = useToast();
  const { vue, setVue } = useVueListe();
  const [coursiers, setCoursiers] = useState<Coursier[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [coursierEnEdition, setCoursierEnEdition] = useState<Coursier | null>(null);
  const [coursierAffiche, setCoursierAffiche] = useState<Coursier | null>(null);

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

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(coursiers);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Coursiers <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({coursiers.length})</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter un coursier
          </button>
        </div>
      </div>

      {coursiers.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", marginTop: "1.5rem" }}>Aucun coursier enregistré.</p>
      )}

      {coursiers.length > 0 && vue === "cartes" && (
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
              </div>
            </div>
          ))}
        </div>
      )}

      {coursiers.length > 0 && vue === "tableau" && (
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
