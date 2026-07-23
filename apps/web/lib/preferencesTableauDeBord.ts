"use client";

const CLE = "dispo-coursier:afficher-stats-gestion";

export function lireAfficherStatsGestion(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLE) === "1";
}

export function ecrireAfficherStatsGestion(valeur: boolean) {
  window.localStorage.setItem(CLE, valeur ? "1" : "0");
}
