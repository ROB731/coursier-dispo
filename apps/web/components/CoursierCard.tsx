import { CoursierBorne } from "@/lib/types";
import { StatutBadge } from "./StatutBadge";

export function CoursierCard({ coursier, onSelect }: { coursier: CoursierBorne; onSelect: (c: CoursierBorne) => void }) {
  const disponible = coursier.statut === "DISPONIBLE";

  return (
    <button
      onClick={() => onSelect(coursier)}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        minWidth: 140,
        minHeight: 160,
        borderColor: disponible ? "var(--color-disponible)" : "var(--color-non-disponible)",
        borderWidth: 2,
      }}
    >
      <img
        src={coursier.photoUrl}
        alt=""
        style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
      />
      <StatutBadge statut={coursier.statut} contexte="borne" />
      <strong style={{ fontSize: "1.1rem" }}>{coursier.code}</strong>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        {coursier.prenom} {coursier.nom}
      </span>
    </button>
  );
}
