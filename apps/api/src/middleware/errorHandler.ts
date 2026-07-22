import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  console.error(err);
  return res.status(500).json({ error: "Erreur interne du serveur" });
}
