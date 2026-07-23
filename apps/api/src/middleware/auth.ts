import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { prisma } from "../lib/prisma";
import { UnauthorizedError } from "../lib/errors";

interface TokenPayload {
  id: string;
  role: string;
  identifiant: string;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.session;
    if (!token) throw new UnauthorizedError();

    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    // Vérifié en base à chaque requête : un compte désactivé perd l'accès immédiatement,
    // sans attendre l'expiration du JWT (12h par défaut).
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: payload.id } });
    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedError();
    }

    req.utilisateur = {
      id: utilisateur.id,
      role: utilisateur.role,
      identifiant: utilisateur.identifiant,
      nomComplet: utilisateur.nomComplet,
    };
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
