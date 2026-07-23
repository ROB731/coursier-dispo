"use client";

import { CoursierBorne } from "@/lib/types";
import { StatutBadge } from "./StatutBadge";

export function RecapDetailsModal({ coursiers, onClose }: { coursiers: CoursierBorne[]; onClose: () => void }) {
  const tries = [...coursiers].sort((a, b) => {
    if (a.statut === b.statut) return a.code.localeCompare(b.code);
    return a.statut === "DISPONIBLE" ? -1 : 1;
  });

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
        zIndex: 55,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: "1.25rem", maxWidth: "26.25rem", width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Détail des coursiers</h2>
          <button type="button" className="btn-text" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {tries.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <img
                src={c.photoUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.9rem" }}>
                  {c.prenom} {c.nom}
                </strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.4rem", fontSize: "0.85rem" }}>{c.code}</span>
              </div>
              <StatutBadge statut={c.statut} contexte="borne" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
