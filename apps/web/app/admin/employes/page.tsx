"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Employe } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { useVueListe } from "@/lib/useVueListe";
import { ViewToggle } from "@/components/ViewToggle";
import { Modal } from "@/components/Modal";
import { EmployeForm } from "@/components/EmployeForm";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";

export default function EmployesPage() {
  const { showToast } = useToast();
  const { vue, setVue } = useVueListe();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [employeEnEdition, setEmployeEnEdition] = useState<Employe | null>(null);

  async function recharger() {
    setEmployes(await api.get<Employe[]>("/api/employes"));
  }

  useEffect(() => {
    recharger();
  }, []);

  async function basculerActivation(e: Employe) {
    const action = e.actif ? "desactiver" : "reactiver";
    await api.post(`/api/employes/${e.id}/${action}`);
    showToast(e.actif ? "Employé désactivé" : "Employé réactivé");
    recharger();
  }

  function ouvrirCreation() {
    setEmployeEnEdition(null);
    setModalOuvert(true);
  }

  function ouvrirEdition(e: Employe) {
    setEmployeEnEdition(e);
    setModalOuvert(true);
  }

  function surSucces() {
    setModalOuvert(false);
    recharger();
  }

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(employes);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Employés <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({employes.length})</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter un employé
          </button>
        </div>
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        Personnel de bureau — séparé des coursiers. Pour marquer les présences du jour, voir{" "}
        <a href="/admin/presences" className="link">
          Présences
        </a>
        .
      </p>

      {employes.length === 0 && <p style={{ color: "var(--color-text-muted)", marginTop: "1rem" }}>Aucun employé enregistré.</p>}

      {employes.length > 0 && vue === "cartes" && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pageItems.map((e) => (
            <div key={e.id} className="card list-row">
              {e.photoUrl ? (
                <img src={e.photoUrl} alt="" className="list-avatar" />
              ) : (
                <div className="list-avatar" style={{ background: "var(--color-border)" }} />
              )}
              <div className="list-row-info">
                <strong>
                  {e.prenom} {e.nom}
                </strong>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {[e.poste, e.site?.nom].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${e.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                  {e.actif ? "Actif" : "Désactivé"}
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
      )}

      {employes.length > 0 && vue === "tableau" && (
        <div className="table-wrap table-wrap-scroll" style={{ marginTop: "1rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Nom</th>
                <th>Poste</th>
                <th>Site</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((e, index) => (
                <tr key={e.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td>
                    {e.photoUrl ? (
                      <img src={e.photoUrl} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--color-border)" }} />
                    )}
                  </td>
                  <td>
                    {e.prenom} {e.nom}
                  </td>
                  <td>{e.poste ?? "—"}</td>
                  <td>{e.site?.nom ?? "—"}</td>
                  <td>
                    <span className={`badge ${e.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                      {e.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(e)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(e)}>
                        {e.actif ? "Désactiver" : "Réactiver"}
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
        <Modal titre={employeEnEdition ? "Modifier l'employé" : "Nouvel employé"} onClose={() => setModalOuvert(false)} maxWidth="30rem">
          <EmployeForm employe={employeEnEdition ?? undefined} onSuccess={surSucces} />
        </Modal>
      )}
    </div>
  );
}
