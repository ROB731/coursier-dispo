"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role, Utilisateur } from "@/lib/types";

export function RequireRole({
  utilisateur,
  roles,
  children,
}: {
  utilisateur: Utilisateur | null;
  roles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (utilisateur && !roles.includes(utilisateur.role)) {
      router.push("/app");
    }
  }, [utilisateur, roles, router]);

  if (!utilisateur || !roles.includes(utilisateur.role)) return null;
  return <>{children}</>;
}
