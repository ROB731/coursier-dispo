import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { getParametres, modifierParametres } from "../services/parametresService";
import { ValidationError } from "../lib/errors";

export const parametresRouter = Router();

parametresRouter.use(requireAuth, chargerPerimetre);

parametresRouter.get("/", async (req, res) => {
  const { entrepriseId } = req.query;
  if (typeof entrepriseId !== "string") throw new ValidationError("entrepriseId requis");
  res.json(await getParametres(entrepriseId, req.entreprisesAccessibles ?? null));
});

const parametresSchema = z.object({
  entrepriseId: z.string().uuid(),
  modeMultiSite: z.boolean().optional(),
  fenetreAnnulationBorneMinutes: z.number().int().positive().optional(),
  intervallePollingSecondes: z.number().int().positive().optional(),
  clotureAutoActive: z.boolean().optional(),
});

parametresRouter.patch(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR"),
  validateBody(parametresSchema),
  journaliser("Modification des paramètres", (req) => req.body?.entrepriseId),
  async (req, res) => {
    const { entrepriseId, ...donnees } = req.body;
    res.json(await modifierParametres(entrepriseId, donnees, req.entreprisesAccessibles ?? null, req.utilisateur!.role));
  }
);
