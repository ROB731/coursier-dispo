import { CoursierBorne } from "@/lib/types";
import { formatDepuis } from "@/lib/dates";
import { StatutBadge } from "./StatutBadge";
import { IconZoom } from "./icons";

export function CoursierCard({
  coursier,
  onSelect,
  onZoom,
}: {
  coursier: CoursierBorne;
  onSelect: (c: CoursierBorne) => void;
  onZoom: (c: CoursierBorne) => void;
}) {
  const disponible = coursier.statut === "DISPONIBLE";
  const journeeTerminee = !disponible && coursier.journeeTerminee;

  return (
    <div
      role="button"
      tabIndex={journeeTerminee ? -1 : 0}
      onClick={() => {
        if (!journeeTerminee) onSelect(coursier);
      }}
      onKeyDown={(e) => {
        if (!journeeTerminee && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(coursier);
        }
      }}
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
      <button
        type="button"
        className="btn-text"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(coursier);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label={`Agrandir la photo de ${coursier.prenom} ${coursier.nom}`}
        title="Agrandir la photo"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0.35rem" }}
      >
        <IconZoom size={16} />
        <span style={{ fontSize: "0.75rem" }}>Voir la photo</span>
      </button>
      <StatutBadge statut={coursier.statut} journeeTerminee={coursier.journeeTerminee} contexte="borne" />
      <strong style={{ fontSize: "1.1rem" }}>{coursier.code}</strong>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        {coursier.prenom} {coursier.nom}
      </span>
      {coursier.depuis && (
        <small style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {coursier.statut === "DISPONIBLE" ? "Entrée" : "Sortie"} {formatDepuis(coursier.depuis)}
        </small>
      )}
    </div>
  );
}
