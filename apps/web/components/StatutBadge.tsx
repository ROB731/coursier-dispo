import { Statut } from "@/lib/types";

export function StatutBadge({
  statut,
  journeeTerminee = false,
  contexte = "standard",
}: {
  statut: Statut;
  journeeTerminee?: boolean;
  contexte?: "standard" | "borne";
}) {
  const disponible = statut === "DISPONIBLE";
  // Journée terminée (après la fermeture) : état normal/attendu jusqu'au
  // lendemain — pas un problème, donc pas la couleur d'alerte rouge.
  const journeeTermineeEffective = !disponible && journeeTerminee;

  const libelle =
    contexte === "borne"
      ? disponible
        ? "Il est présent"
        : journeeTermineeEffective
          ? "Il est rentré chez lui"
          : "Il est sorti"
      : disponible
        ? "Disponible"
        : "Non disponible";

  const classeBadge = disponible ? "badge-disponible" : journeeTermineeEffective ? "badge-cloture" : "badge-non-disponible";

  return (
    <span className={`badge ${classeBadge}`} style={contexte === "borne" ? { fontSize: "0.78rem", padding: "0.22rem 0.55rem" } : undefined}>
      <span aria-hidden="true">{disponible ? "●" : "○"}</span>
      {libelle}
    </span>
  );
}
