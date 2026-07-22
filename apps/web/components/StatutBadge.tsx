import { Statut } from "@/lib/types";

export function StatutBadge({ statut }: { statut: Statut }) {
  const disponible = statut === "DISPONIBLE";
  return (
    <span className={`badge ${disponible ? "badge-disponible" : "badge-non-disponible"}`}>
      <span aria-hidden="true">{disponible ? "●" : "○"}</span>
      {disponible ? "Disponible" : "Non disponible"}
    </span>
  );
}
