import { Statut } from "@/lib/types";

export function StatutBadge({
  statut,
  contexte = "standard",
}: {
  statut: Statut;
  contexte?: "standard" | "borne";
}) {
  const disponible = statut === "DISPONIBLE";
  const libelle =
    contexte === "borne"
      ? disponible
        ? "Il est présent"
        : "Il est sorti"
      : disponible
        ? "Disponible"
        : "Non disponible";

  return (
    <span
      className={`badge ${disponible ? "badge-disponible" : "badge-non-disponible"}`}
      style={contexte === "borne" ? { fontSize: "0.78rem", padding: "0.22rem 0.55rem" } : undefined}
    >
      <span aria-hidden="true">{disponible ? "●" : "○"}</span>
      {libelle}
    </span>
  );
}
