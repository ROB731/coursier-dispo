import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../env";
import { UnauthorizedError } from "../lib/errors";

const SALT_ROUNDS = 12;

export async function hashPassword(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, SALT_ROUNDS);
}

export async function verifyPassword(motDePasse: string, hash: string): Promise<boolean> {
  return bcrypt.compare(motDePasse, hash);
}

interface TokenPayload {
  id: string;
  role: string;
  identifiant: string;
}

export function issueToken(payload: TokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRATION as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export async function login(identifiant: string, motDePasse: string) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { identifiant } });

  // Message volontairement identique que l'identifiant ou le mot de passe soit erroné,
  // pour ne pas révéler l'existence d'un compte.
  if (!utilisateur || !utilisateur.actif) {
    throw new UnauthorizedError("Identifiant ou mot de passe incorrect");
  }

  const motDePasseValide = await verifyPassword(motDePasse, utilisateur.motDePasseHash);
  if (!motDePasseValide) {
    throw new UnauthorizedError("Identifiant ou mot de passe incorrect");
  }

  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { derniereConnexionAt: new Date() },
  });

  const token = issueToken({
    id: utilisateur.id,
    role: utilisateur.role,
    identifiant: utilisateur.identifiant,
  });

  return {
    token,
    utilisateur: {
      id: utilisateur.id,
      identifiant: utilisateur.identifiant,
      nomComplet: utilisateur.nomComplet,
      role: utilisateur.role,
      siteParDefautId: utilisateur.siteParDefautId,
    },
  };
}
