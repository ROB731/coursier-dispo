"use client";

import { VueListe } from "@/lib/useVueListe";

export function ViewToggle({ vue, onChange }: { vue: VueListe; onChange: (v: VueListe) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="Type d'affichage">
      <button type="button" className={vue === "cartes" ? "actif" : ""} onClick={() => onChange("cartes")}>
        ▦ Cartes
      </button>
      <button type="button" className={vue === "tableau" ? "actif" : ""} onClick={() => onChange("tableau")}>
        ☰ Tableau
      </button>
    </div>
  );
}
