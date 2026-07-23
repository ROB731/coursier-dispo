import { RoleUtilisateur } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      utilisateur?: {
        id: string;
        role: RoleUtilisateur;
        identifiant: string;
        nomComplet: string;
      };
      /** null = accès à toutes les entreprises (SUPER_ADMIN). Attaché par chargerPerimetre. */
      entreprisesAccessibles?: string[] | null;
    }
  }
}

export {};
