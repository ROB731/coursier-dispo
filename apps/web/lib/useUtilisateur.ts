"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./apiClient";
import { Utilisateur } from "./types";

export function useUtilisateur() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api
      .get<Utilisateur>("/api/auth/me")
      .then(setUtilisateur)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.push("/login");
      })
      .finally(() => setChargement(false));
  }, [router]);

  return { utilisateur, chargement };
}
