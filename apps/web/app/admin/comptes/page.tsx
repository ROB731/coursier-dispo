"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { LIBELLE_ROLE } from "@/lib/roles";
import { Compte } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { useVueListe } from "@/lib/useVueListe";
import { ViewToggle } from "@/components/ViewToggle";
import { Modal } from "@/components/Modal";
import { CompteForm } from "@/components/CompteForm";
import { useUtilisateur } from "@/lib/useUtilisateur";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/Pagination";

function libelleRattachement(c: Compte): string {
  if (c.role === "SUPER_ADMIN") return "Toutes les entreprises";
  if (c.role === "DIRECTEUR") return c.directeurEntreprises.map((d) => d.entreprise.nom).join(", ") || "Aucune entreprise";
  if (c.entreprise) return c.entreprise.nom;
  if (c.directeur) return `Via ${c.directeur.nomComplet}`;
  return "Non rattaché";
}

export default function ComptesPage() {
  const { showToast } = useToast();
  const { utilisateur } = useUtilisateur();
  const { vue, setVue } = useVueListe();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [compteEnEdition, setCompteEnEdition] = useState<Compte | null>(null);

  async function recharger() {
    setComptes(await api.get<Compte[]>("/api/utilisateurs"));
  }

  useEffect(() => {
    recharger();
  }, []);

  async function basculerActivation(c: Compte) {
    const action = c.actif ? "desactiver" : "reactiver";
    await api.post(`/api/utilisateurs/${c.id}/${action}`);
    showToast(c.actif ? "Compte désactivé" : "Compte réactivé");
    recharger();
  }

  function ouvrirCreation() {
    setCompteEnEdition(null);
    setModalOuvert(true);
  }

  function ouvrirEdition(c: Compte) {
    setCompteEnEdition(c);
    setModalOuvert(true);
  }

  function surSucces() {
    setModalOuvert(false);
    recharger();
  }

  const { page, setPage, nbPages, pageItems, decalage } = usePagination(comptes);

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Comptes <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({comptes.length})</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ViewToggle vue={vue} onChange={setVue} />
          <button type="button" className="btn btn-primary" onClick={ouvrirCreation}>
            + Ajouter un compte
          </button>
        </div>
      </div>

      {vue === "cartes" && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {pageItems.map((c) => (
            <div key={c.id} className="card list-row">
              <div className="list-row-info">
                <strong>{c.nomComplet}</strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>@{c.identifiant}</span>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {LIBELLE_ROLE[c.role]} · {libelleRattachement(c)}
                </div>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${c.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                  {c.actif ? "Actif" : "Désactivé"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(c)}>
                  Modifier
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(c)}>
                  {c.actif ? "Désactiver" : "Réactiver"}
                </button>
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
                <th>Identifiant</th>
                <th>Rôle</th>
                <th>Rattachement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c, index) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--color-text-muted)" }}>{decalage + index + 1}</td>
                  <td>{c.nomComplet}</td>
                  <td>@{c.identifiant}</td>
                  <td>{LIBELLE_ROLE[c.role]}</td>
                  <td>{libelleRattachement(c)}</td>
                  <td>
                    <span className={`badge ${c.actif ? "badge-disponible" : "badge-non-disponible"}`}>
                      {c.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => ouvrirEdition(c)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => basculerActivation(c)}>
                        {c.actif ? "Désactiver" : "Réactiver"}
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

      {modalOuvert && utilisateur && (
        <Modal
          titre={compteEnEdition ? "Modifier le compte" : "Nouveau compte"}
          onClose={() => setModalOuvert(false)}
          maxWidth="30rem"
        >
          <CompteForm compte={compteEnEdition ?? undefined} roleCreateur={utilisateur.role} onSuccess={surSucces} />
        </Modal>
      )}
    </div>
  );
}
