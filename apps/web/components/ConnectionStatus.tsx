"use client";

import { useEffect, useState } from "react";

type EtatConnexion = "connecte" | "hors-connexion" | "verification";

const INTERVALLE_MS = 20_000;

const LIBELLE: Record<EtatConnexion, string> = {
  connecte: "Connecté",
  "hors-connexion": "Hors connexion",
  verification: "Vérification…",
};

const COULEUR: Record<EtatConnexion, string> = {
  connecte: "var(--color-disponible)",
  "hors-connexion": "var(--color-non-disponible)",
  verification: "var(--color-text-muted)",
};

/** Petit indicateur d'état de connexion (réseau + API atteignable) — utile
 * pour une borne ou un tableau de bord laissé ouvert sans surveillance :
 * on voit tout de suite si les données affichées ne se rafraîchissent plus. */
export function ConnectionStatus() {
  const [etat, setEtat] = useState<EtatConnexion>("verification");

  useEffect(() => {
    let annule = false;

    async function verifier() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!annule) setEtat("hors-connexion");
        return;
      }
      try {
        const res = await fetch("/health", { cache: "no-store" });
        if (!annule) setEtat(res.ok ? "connecte" : "hors-connexion");
      } catch {
        if (!annule) setEtat("hors-connexion");
      }
    }

    verifier();
    const intervalle = setInterval(verifier, INTERVALLE_MS);

    function surRetour() {
      verifier();
    }
    function surPerte() {
      setEtat("hors-connexion");
    }
    window.addEventListener("online", surRetour);
    window.addEventListener("offline", surPerte);

    return () => {
      annule = true;
      clearInterval(intervalle);
      window.removeEventListener("online", surRetour);
      window.removeEventListener("offline", surPerte);
    };
  }, []);

  return (
    <span
      title={LIBELLE[etat]}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--color-text-muted)", flexShrink: 0 }}
    >
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: COULEUR[etat], flexShrink: 0 }} />
      <span className="connection-label">{LIBELLE[etat]}</span>
    </span>
  );
}
