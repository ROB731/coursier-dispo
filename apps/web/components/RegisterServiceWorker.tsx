"use client";

import { useEffect } from "react";
import { enregistrerServiceWorker, renouvelerAbonnementPushSiAutorise } from "@/lib/pushNotifications";

/** Enregistre le service worker sur toutes les pages, sans prompt de
 * permission — condition nécessaire pour que la PWA soit installable.
 * Renouvelle aussi l'abonnement push (silencieux si jamais autorisé). */
export function RegisterServiceWorker() {
  useEffect(() => {
    enregistrerServiceWorker();
    renouvelerAbonnementPushSiAutorise();
  }, []);

  return null;
}
