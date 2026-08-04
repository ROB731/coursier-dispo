"use client";

import { useState } from "react";
import { EmployeBorne } from "@/lib/types";
import { IconArrowRight } from "@/components/icons";

type TypeAction = "ENTREE" | "SORTIE";

export function ConfirmationEmployeModal({
  employe,
  enCours,
  onConfirm,
  onClose,
}: {
  employe: EmployeBorne;
  enCours: boolean;
  onConfirm: (type: TypeAction) => void;
  onClose: () => void;
}) {
  const dejaArrive = employe.presence?.statut === "PRESENT";
  const suggestion: TypeAction = dejaArrive ? "SORTIE" : "ENTREE";
  const autre: TypeAction = suggestion === "SORTIE" ? "ENTREE" : "SORTIE";
  const [typeChoisi, setTypeChoisi] = useState<TypeAction>(suggestion);

  const estEntree = typeChoisi === "ENTREE";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: "1.5rem", maxWidth: "22.5rem", width: "100%", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        {employe.photoUrl ? (
          <img
            src={employe.photoUrl}
            alt=""
            style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem" }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--color-border)", margin: "0 auto 1rem" }} />
        )}
        <h2 style={{ margin: "0 0 1rem" }}>
          {employe.prenom} {employe.nom}
        </h2>

        <div style={{ marginBottom: "1.25rem" }}>
          <span className={`badge badge-lg ${estEntree ? "badge-disponible" : "badge-non-disponible"}`}>
            <span aria-hidden="true">{estEntree ? "●" : "○"}</span>
            {estEntree ? "Entrée du matin" : "Sortie du soir"}
          </span>
        </div>

        <button
          className={`btn ${estEntree ? "btn-etat-entree" : "btn-etat-sortie"}`}
          style={{ width: "100%", marginBottom: "0.75rem" }}
          disabled={enCours}
          onClick={() => onConfirm(typeChoisi)}
        >
          <span aria-hidden="true">{estEntree ? "●" : "○"}</span>
          {enCours ? "Enregistrement…" : estEntree ? "Confirmer l'ENTRÉE" : "Confirmer la SORTIE"}
        </button>

        <button
          type="button"
          className="btn-text"
          disabled={enCours}
          onClick={() => setTypeChoisi(autre)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          Ce n&apos;est pas ça <IconArrowRight size={14} /> {autre === "ENTREE" ? "Entrée du matin" : "Sortie du soir"}
        </button>

        <div style={{ marginTop: "1rem" }}>
          <button type="button" className="btn-text" disabled={enCours} onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
