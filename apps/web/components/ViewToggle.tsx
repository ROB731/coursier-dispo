"use client";

import { VueListe } from "@/lib/useVueListe";
import { IconGrid, IconMenu } from "@/components/icons";

export function ViewToggle({ vue, onChange }: { vue: VueListe; onChange: (v: VueListe) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="Type d'affichage">
      <button
        type="button"
        className={vue === "cartes" ? "actif" : ""}
        onClick={() => onChange("cartes")}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <IconGrid size={15} /> Cartes
      </button>
      <button
        type="button"
        className={vue === "tableau" ? "actif" : ""}
        onClick={() => onChange("tableau")}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <IconMenu size={15} /> Tableau
      </button>
    </div>
  );
}
