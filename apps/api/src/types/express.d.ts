import { RoleUtilisateur } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      utilisateur?: {
        id: string;
        role: RoleUtilisateur;
        identifiant: string;
      };
    }
  }
}

export {};
