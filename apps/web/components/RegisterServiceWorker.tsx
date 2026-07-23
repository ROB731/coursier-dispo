"use client";

import { useEffect } from "react";
import { enregistrerServiceWorker } from "@/lib/pushNotifications";

/** Enregistre le service worker sur toutes les pages, sans prompt de
 * permission — condition nécessaire pour que la PWA soit installable. */
export function RegisterServiceWorker() {
  useEffect(() => {
    enregistrerServiceWorker();
  }, []);

  return null;
}
