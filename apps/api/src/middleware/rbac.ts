import { NextFunction, Request, Response } from "express";
import { RoleUtilisateur } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export function requireRole(...rolesAutorises: RoleUtilisateur[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.utilisateur) throw new UnauthorizedError();
    if (!rolesAutorises.includes(req.utilisateur.role)) {
      throw new ForbiddenError("Votre rôle ne permet pas cette action");
    }
    next();
  };
}
