"use client";

import { useState } from "react";
import { CoursierBorne } from "@/lib/types";

type TypeAction = "ENTREE" | "SORTIE";

export function ConfirmationModal({
  coursier,
  enCours,
  onConfirm,
  onClose,
}: {
  coursier: CoursierBorne;
  enCours: boolean;
  onConfirm: (type: TypeAction) => void;
  onClose: () => void;
}) {
  const suggestion: TypeAction = coursier.statut === "DISPONIBLE" ? "SORTIE" : "ENTREE";
  const autre: TypeAction = suggestion === "SORTIE" ? "ENTREE" : "SORTIE";
  const [typeChoisi, setTypeChoisi] = useState<TypeAction>(suggestion);

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
        style={{ padding: "1.5rem", maxWidth: 360, width: "100%", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={coursier.photoUrl}
          alt=""
          style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem" }}
        />
        <h2 style={{ margin: "0 0 1.5rem" }}>
          {coursier.prenom} {coursier.nom} — {coursier.code}
        </h2>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginBottom: "0.75rem" }}
          disabled={enCours}
          onClick={() => onConfirm(typeChoisi)}
        >
          {enCours ? "Enregistrement…" : `Confirmer la ${typeChoisi === "ENTREE" ? "ENTRÉE" : "SORTIE"}`}
        </button>

        <button
          type="button"
          className="btn-text"
          disabled={enCours}
          onClick={() => setTypeChoisi(autre)}
        >
          Ce n&apos;est pas ça → {autre === "ENTREE" ? "Entrée" : "Sortie"}
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
