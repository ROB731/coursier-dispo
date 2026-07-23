"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/lib/types";

const LIENS = [
  { href: "/admin", label: "Tableau de bord", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
  { href: "/admin/entreprises", label: "Entreprises", roles: ["SUPER_ADMIN"] as Role[] },
  { href: "/admin/coursiers", label: "Coursiers", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
  { href: "/admin/comptes", label: "Comptes", roles: ["SUPER_ADMIN", "DIRECTEUR"] as Role[] },
  { href: "/admin/sites", label: "Sites", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
  { href: "/admin/bornes", label: "À la porte", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
  { href: "/admin/historique", label: "Historique", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
  { href: "/admin/parametres", label: "Paramètres", roles: ["SUPER_ADMIN", "DIRECTEUR"] as Role[] },
  { href: "/admin/profil", label: "Mon profil", roles: ["SUPER_ADMIN", "DIRECTEUR", "GERANTE"] as Role[] },
];

export function AdminNav({ ouvert, onFermer, role }: { ouvert: boolean; onFermer: () => void; role: Role }) {
  const pathname = usePathname();
  const liensVisibles = LIENS.filter((lien) => lien.roles.includes(role));

  return (
    <>
      {ouvert && <div className="nav-backdrop" onClick={onFermer} />}
      <nav className={`admin-sidebar ${ouvert ? "ouvert" : ""}`} aria-label="Navigation administration">
        {liensVisibles.map((lien) => {
          const actif = lien.href === "/admin" ? pathname === "/admin" : pathname.startsWith(lien.href);
          return (
            <Link
              key={lien.href}
              href={lien.href}
              onClick={onFermer}
              className={`admin-sidebar-link ${actif ? "actif" : ""}`}
            >
              {lien.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
