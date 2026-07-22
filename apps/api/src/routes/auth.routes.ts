import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { login } from "../services/authService";
import { prisma } from "../lib/prisma";
import { env } from "../env";

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
  seSouvenir: z.boolean().optional().default(false),
});

const DOUZE_HEURES_MS = 12 * 60 * 60 * 1000;
const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

authRouter.post("/login", loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { identifiant, motDePasse, seSouvenir } = req.body;
  const { token, utilisateur } = await login(identifiant, motDePasse);

  res.cookie("session", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: seSouvenir ? TRENTE_JOURS_MS : DOUZE_HEURES_MS,
  });

  res.json({ utilisateur });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: req.utilisateur!.id } });
  res.json({
    id: utilisateur!.id,
    identifiant: utilisateur!.identifiant,
    nomComplet: utilisateur!.nomComplet,
    role: utilisateur!.role,
    siteParDefautId: utilisateur!.siteParDefautId,
  });
});
