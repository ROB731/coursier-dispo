import { EmployeBorne } from "@/lib/types";

export function EmployeCardBorne({ employe, onSelect }: { employe: EmployeBorne; onSelect: (e: EmployeBorne) => void }) {
  const present = employe.presence?.statut === "PRESENT";
  const reparti = present && Boolean(employe.presence?.heureSortie);

  const libelle = reparti ? "Reparti" : present ? "Arrivé ce matin" : "Pas encore arrivé";
  const couleur = reparti ? "var(--color-text-muted)" : present ? "var(--color-disponible)" : "var(--color-non-disponible)";
  const classeBadge = reparti ? "badge-cloture" : present ? "badge-disponible" : "badge-non-disponible";

  return (
    <button
      onClick={() => onSelect(employe)}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        minWidth: 140,
        minHeight: 160,
        borderColor: couleur,
        borderWidth: 2,
      }}
    >
      {employe.photoUrl ? (
        <img
          src={employe.photoUrl}
          alt=""
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
        />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-border)" }} />
      )}
      <span className={`badge ${classeBadge}`} style={{ fontSize: "0.78rem", padding: "0.22rem 0.55rem" }}>
        {libelle}
      </span>
      <strong style={{ fontSize: "1rem", textAlign: "center" }}>
        {employe.prenom} {employe.nom}
      </strong>
      {employe.poste && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center" }}>{employe.poste}</span>}
    </button>
  );
}
