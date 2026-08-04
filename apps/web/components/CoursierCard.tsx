import { CoursierBorne } from "@/lib/types";
import { StatutBadge } from "./StatutBadge";

export function CoursierCard({ coursier, onSelect }: { coursier: CoursierBorne; onSelect: (c: CoursierBorne) => void }) {
  const disponible = coursier.statut === "DISPONIBLE";
  const journeeTerminee = !disponible && coursier.journeeTerminee;

  return (
    <button
      onClick={() => onSelect(coursier)}
      disabled={journeeTerminee}
      title={journeeTerminee ? "Journée terminée — reprend demain" : undefined}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        minWidth: 140,
        minHeight: 160,
        borderColor: disponible ? "var(--color-disponible)" : journeeTerminee ? "var(--color-border)" : "var(--color-non-disponible)",
        borderWidth: 2,
        opacity: journeeTerminee ? 0.65 : 1,
        cursor: journeeTerminee ? "not-allowed" : "pointer",
      }}
    >
      <img
        src={coursier.photoUrl}
        alt=""
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--color-border)",
          filter: journeeTerminee ? "grayscale(0.7)" : "none",
        }}
      />
      <StatutBadge statut={coursier.statut} journeeTerminee={coursier.journeeTerminee} contexte="borne" />
      <strong style={{ fontSize: "1.1rem" }}>{coursier.code}</strong>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        {coursier.prenom} {coursier.nom}
      </span>
    </button>
  );
}
