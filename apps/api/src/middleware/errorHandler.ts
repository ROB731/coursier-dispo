import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../lib/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "L'image dépasse la taille maximale autorisée (5 Mo)" : "Échec du téléversement du fichier";
    return res.status(400).json({ error: message, code: err.code });
  }

  console.error(err);
  return res.status(500).json({ error: "Erreur interne du serveur" });
}
