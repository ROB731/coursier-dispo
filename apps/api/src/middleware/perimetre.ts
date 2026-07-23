import { NextFunction, Request, Response } from "express";
import { getEntreprisesAccessibles } from "../services/perimetreService";
import { ForbiddenError } from "../lib/errors";

/** À placer après requireAuth : attache req.entreprisesAccessibles (null = toutes). */
export async function chargerPerimetre(req: Request, _res: Response, next: NextFunction) {
  if (!req.utilisateur) return next();
  req.entreprisesAccessibles = await getEntreprisesAccessibles(req.utilisateur.id);
  next();
}

/** Rejette si l'utilisateur n'a accès à aucune entreprise (compte mal configuré). */
export function requirePerimetreNonVide(req: Request, _res: Response, next: NextFunction) {
  if (req.entreprisesAccessibles !== null && req.entreprisesAccessibles?.length === 0) {
    throw new ForbiddenError("Votre compte n'est rattaché à aucune entreprise — contactez votre administrateur");
  }
  next();
}
