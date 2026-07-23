import { NextFunction, Request, Response } from "express";
import { enregistrerActivite } from "../services/journalActiviteService";

/**
 * Journalise une action de gestion après une réponse réussie (2xx/3xx).
 * `cible` peut référencer le paramètre de route à inclure (ex. ":id") ou une
 * fonction dérivant un libellé lisible à partir du corps de la requête.
 */
export function journaliser(action: string, cible?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode < 400 && req.utilisateur) {
        enregistrerActivite({
          utilisateurId: req.utilisateur.id,
          nomUtilisateur: req.utilisateur.nomComplet,
          action,
          cible: cible?.(req),
        });
      }
    });
    next();
  };
}
