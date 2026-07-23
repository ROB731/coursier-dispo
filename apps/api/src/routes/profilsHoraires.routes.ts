import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { creerProfilHoraire, listerProfilsHoraires, modifierProfilHoraire } from "../services/profilHoraireService";

export const profilsHorairesRouter = Router();

const jourEnum = z.enum(["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]);
const heureRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const plageSchema = z.object({
  debut: z.string().regex(heureRegex, "Format attendu HH:mm"),
  fin: z.string().regex(heureRegex, "Format attendu HH:mm"),
});
const horairesSchema = z.record(jourEnum, plageSchema).refine((h) => Object.keys(h).length > 0, {
  message: "Sélectionnez au moins un jour travaillé",
});

const profilSchema = z.object({
  nom: z.string().min(1),
  horaires: horairesSchema,
  estParDefaut: z.boolean().optional(),
  entrepriseId: z.string().uuid(),
});

profilsHorairesRouter.use(requireAuth, chargerPerimetre);

profilsHorairesRouter.get("/", async (req, res) => {
  const { entrepriseId } = req.query;
  res.json(
    await listerProfilsHoraires(req.entreprisesAccessibles ?? null, typeof entrepriseId === "string" ? entrepriseId : undefined)
  );
});

profilsHorairesRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(profilSchema),
  journaliser("Création d'un profil horaire", (req) => req.body?.nom),
  async (req, res) => {
    res.status(201).json(await creerProfilHoraire(req.body, req.entreprisesAccessibles ?? null));
  }
);

profilsHorairesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(profilSchema.partial().omit({ entrepriseId: true }).extend({ actif: z.boolean().optional() })),
  journaliser("Modification d'un profil horaire", (req) => req.params.id),
  async (req, res) => {
    res.json(await modifierProfilHoraire(req.params.id, req.body, req.entreprisesAccessibles ?? null));
  }
);
