"use client";

import { useState } from "react";
import { CoursierBorne } from "@/lib/types";
import { formatDepuis } from "@/lib/dates";
import { StatutBadge } from "./StatutBadge";
import { IconArrowRight, IconX } from "@/components/icons";

/** Plus tôt arrivé/parti en premier ; ceux sans aucune activité aujourd'hui
 * (jamais rattachés à un événement) sont relégués en fin de liste. */
function trierParHeure(coursiers: CoursierBorne[]): CoursierBorne[] {
  return [...coursiers].sort((a, b) => {
    if (!a.depuis && !b.depuis) return a.code.localeCompare(b.code);
    if (!a.depuis) return 1;
    if (!b.depuis) return -1;
    return new Date(a.depuis).getTime() - new Date(b.depuis).getTime();
  });
}

export function RecapDetailsModal({
  coursiers,
  onAction,
  onClose,
}: {
  coursiers: CoursierBorne[];
  onAction: (coursier: CoursierBorne) => void;
  onClose: () => void;
}) {
  const [filtre, setFiltre] = useState<"PRESENTS" | "ABSENTS">("PRESENTS");
  const presents = coursiers.filter((c) => c.statut === "DISPONIBLE");
  const absents = coursiers.filter((c) => c.statut !== "DISPONIBLE");
  const coursiersFiltres = trierParHeure(filtre === "PRESENTS" ? presents : absents);

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
            <IconX size={17} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setFiltre("PRESENTS")}
            aria-pressed={filtre === "PRESENTS"}
            style={{
              padding: "0.7rem 0.6rem",
              border: "2px solid var(--color-disponible)",
              borderRadius: "var(--radius-sm)",
              background: filtre === "PRESENTS" ? "var(--color-disponible-bg)" : "transparent",
              color: "var(--color-disponible)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Présents ({presents.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltre("ABSENTS")}
            aria-pressed={filtre === "ABSENTS"}
            style={{
              padding: "0.7rem 0.6rem",
              border: "2px solid var(--color-non-disponible)",
              borderRadius: "var(--radius-sm)",
              background: filtre === "ABSENTS" ? "var(--color-non-disponible-bg)" : "transparent",
              color: "var(--color-non-disponible)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Absents ({absents.length})
          </button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {coursiersFiltres.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem",
                borderLeft: `3px solid ${c.statut === "DISPONIBLE" ? "var(--color-disponible)" : "var(--color-non-disponible)"}`,
              }}
            >
              <img
                src={c.photoUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "0.9rem" }}>
                  {c.prenom} {c.nom}
                </strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.4rem", fontSize: "0.85rem" }}>{c.code}</span>
                {c.depuis && (
                  <small
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: c.statut === "DISPONIBLE" ? "var(--color-disponible)" : "var(--color-non-disponible)",
                    }}
                  >
                    {c.statut === "DISPONIBLE" ? "Entrée" : "Sortie"} {formatDepuis(c.depuis)}
                  </small>
                )}
              </div>
              <StatutBadge statut={c.statut} journeeTerminee={c.journeeTerminee} contexte="borne" />
              <button
                type="button"
                className="btn-text"
                onClick={() => onAction(c)}
                aria-label={`Ouvrir ${c.prenom} ${c.nom}`}
                title="Ouvrir"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.4rem",
                  borderRadius: "999px",
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  flexShrink: 0,
                }}
              >
                <IconArrowRight size={15} />
              </button>
            </div>
          ))}
          {coursiersFiltres.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", margin: "0.75rem 0" }}>
              Aucun coursier dans cette catégorie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
