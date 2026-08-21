import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { journaliser } from "../middleware/journalActivite";
import { login, hashPassword, verifyPassword } from "../services/authService";
import { prisma } from "../lib/prisma";
import { env } from "../env";
import { UnauthorizedError, ValidationError } from "../lib/errors";
import { executerClotureAutomatique } from "../jobs/clotureAutomatique";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives — réessayez dans quelques minutes" },
});

const loginSchema = z.object({
  identifiant: z.string().min(1),
  motDePasse: z.string().min(1),
});

// Pas un poste de travail partagé — la connexion reste valide plusieurs mois
// pour éviter d'avoir à se reconnecter chaque jour. Doit correspondre à
// JWT_EXPIRATION (le cookie ne sert à rien plus longtemps que le jeton qu'il
// contient).
const DUREE_SESSION_MS = 90 * 24 * 60 * 60 * 1000;

// En développement, web et API partagent le même hôte ("localhost", ports
// différents) — SameSite=Strict suffit. En production, web (Vercel) et API
// (Render) sont sur des domaines distincts : le cookie ne serait alors jamais
// envoyé sur les requêtes fetch() cross-site sans SameSite=None (+ Secure,
// obligatoire avec None).
const OPTIONS_COOKIE_SESSION = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "none" : "strict") as "none" | "strict",
};

authRouter.post("/login", loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { identifiant, motDePasse } = req.body;
  const { token, utilisateur } = await login(identifiant, motDePasse);

  res.cookie("session", token, {
    ...OPTIONS_COOKIE_SESSION,
    maxAge: DUREE_SESSION_MS,
  });

  // Filet de sécurité en environnement serverless (pas de process persistant
  // donc pas de cron interne) : on rattrape le retard de clôture automatique
  // à chaque connexion, sans bloquer la réponse. Idempotent — sans effet si
  // un cron régulier (Render, ou route /api/cron/cloture sur Vercel) a déjà fait le travail.
  executerClotureAutomatique().catch((err) => console.error("Erreur clôture automatique (déclenchée au login)", err));

  res.json({ utilisateur });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session", OPTIONS_COOKIE_SESSION);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: req.utilisateur!.id } });
  res.json({
    id: utilisateur!.id,
    identifiant: utilisateur!.identifiant,
    nomComplet: utilisateur!.nomComplet,
    role: utilisateur!.role,
    telephone: utilisateur!.telephone,
    email: utilisateur!.email,
    siteParDefautId: utilisateur!.siteParDefautId,
  });
});

const modifierMoiSchema = z.object({
  nomComplet: z.string().min(1).optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
});

authRouter.patch(
  "/me",
  requireAuth,
  validateBody(modifierMoiSchema),
  journaliser("Modification de son propre profil"),
  async (req, res) => {
    const utilisateur = await prisma.utilisateur.update({ where: { id: req.utilisateur!.id }, data: req.body });
    res.json({
      id: utilisateur.id,
      identifiant: utilisateur.identifiant,
      nomComplet: utilisateur.nomComplet,
      role: utilisateur.role,
      telephone: utilisateur.telephone,
      email: utilisateur.email,
      siteParDefautId: utilisateur.siteParDefautId,
    });
  }
);

const motDePasseMoiSchema = z.object({
  motDePasseActuel: z.string().min(1),
  nouveauMotDePasse: z.string().min(4),
});

authRouter.post(
  "/me/mot-de-passe",
  requireAuth,
  validateBody(motDePasseMoiSchema),
  journaliser("Changement de son propre mot de passe"),
  async (req, res) => {
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: req.utilisateur!.id } });
    if (!utilisateur) throw new UnauthorizedError("Session invalide");
    const valide = await verifyPassword(req.body.motDePasseActuel, utilisateur.motDePasseHash);
    if (!valide) throw new ValidationError("Mot de passe actuel incorrect");
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { motDePasseHash: await hashPassword(req.body.nouveauMotDePasse) },
    });
    res.status(204).send();
  }
);
