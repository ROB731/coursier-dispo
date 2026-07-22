import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateQuery } from "../middleware/validate";
import { annulerEvenement, getHistorique } from "../services/evenementService";

export const evenementsRouter = Router();

evenementsRouter.use(requireAuth);

const historiqueQuerySchema = z.object({
  coursierId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  depuis: z.coerce.date().optional(),
  jusqua: z.coerce.date().optional(),
});

evenementsRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateQuery(historiqueQuerySchema),
  async (req, res) => {
    const { coursierId, siteId, depuis, jusqua } = req.query as unknown as z.infer<typeof historiqueQuerySchema>;
    res.json(await getHistorique({ coursierId, siteId, depuis, jusqua }));
  }
);

evenementsRouter.post("/:id/annuler", requireRole("SUPER_ADMIN", "GERANTE"), async (req, res) => {
  const annulation = await annulerEvenement({
    evenementId: req.params.id,
    source: "COMPTE",
    utilisateurId: req.utilisateur!.id,
  });
  res.status(201).json(annulation);
});
