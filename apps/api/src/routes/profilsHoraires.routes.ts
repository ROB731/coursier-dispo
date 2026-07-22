import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { creerProfilHoraire, listerProfilsHoraires, modifierProfilHoraire } from "../services/profilHoraireService";

export const profilsHorairesRouter = Router();

const jourEnum = z.enum(["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]);
const heureRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const profilSchema = z.object({
  nom: z.string().min(1),
  heureDebut: z.string().regex(heureRegex, "Format attendu HH:mm"),
  heureFin: z.string().regex(heureRegex, "Format attendu HH:mm"),
  joursApplicables: z.array(jourEnum).min(1),
  estParDefaut: z.boolean().optional(),
});

profilsHorairesRouter.use(requireAuth);

profilsHorairesRouter.get("/", async (_req, res) => {
  res.json(await listerProfilsHoraires());
});

profilsHorairesRouter.post("/", requireRole("SUPER_ADMIN"), validateBody(profilSchema), async (req, res) => {
  res.status(201).json(await creerProfilHoraire(req.body));
});

profilsHorairesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validateBody(profilSchema.partial().extend({ actif: z.boolean().optional() })),
  async (req, res) => {
    res.json(await modifierProfilHoraire(req.params.id, req.body));
  }
);
