import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateQuery } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { annulerEvenement, getHistorique } from "../services/evenementService";

export const evenementsRouter = Router();

evenementsRouter.use(requireAuth, chargerPerimetre);

const historiqueQuerySchema = z.object({
  coursierId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  utilisateurId: z.string().uuid().optional(),
  recherche: z.string().min(1).optional(),
  depuis: z.coerce.date().optional(),
  jusqua: z.coerce.date().optional(),
});

evenementsRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateQuery(historiqueQuerySchema),
  async (req, res) => {
    const { coursierId, siteId, utilisateurId, recherche, depuis, jusqua } = req.query as unknown as z.infer<
      typeof historiqueQuerySchema
    >;
    res.json(
      await getHistorique({ coursierId, siteId, utilisateurId, recherche, depuis, jusqua }, req.entreprisesAccessibles ?? null)
    );
  }
);

evenementsRouter.post(
  "/:id/annuler",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  journaliser("Annulation d'un événement de présence", (req) => req.params.id),
  async (req, res) => {
    const annulation = await annulerEvenement({
      evenementId: req.params.id,
      source: "COMPTE",
      utilisateurId: req.utilisateur!.id,
      entreprisesAccessibles: req.entreprisesAccessibles ?? null,
    });
    res.status(201).json(annulation);
  }
);
