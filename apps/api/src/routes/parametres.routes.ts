import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { getParametres, modifierParametres } from "../services/parametresService";

export const parametresRouter = Router();

parametresRouter.use(requireAuth);

parametresRouter.get("/", async (_req, res) => {
  res.json(await getParametres());
});

const parametresSchema = z.object({
  modeMultiSite: z.boolean().optional(),
  fenetreAnnulationBorneMinutes: z.number().int().positive().optional(),
  intervallePollingSecondes: z.number().int().positive().optional(),
  clotureAutoActive: z.boolean().optional(),
});

parametresRouter.patch("/", requireRole("SUPER_ADMIN"), validateBody(parametresSchema), async (req, res) => {
  res.json(await modifierParametres(req.body));
});
