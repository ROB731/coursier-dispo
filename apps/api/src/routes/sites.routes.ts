import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { creerSite, listerSites, modifierSite } from "../services/siteService";

export const sitesRouter = Router();

const siteSchema = z.object({
  nom: z.string().min(1),
  adresse: z.string().optional(),
  ville: z.string().optional(),
});

sitesRouter.use(requireAuth);

sitesRouter.get("/", async (_req, res) => {
  res.json(await listerSites());
});

sitesRouter.post("/", requireRole("SUPER_ADMIN"), validateBody(siteSchema), async (req, res) => {
  res.status(201).json(await creerSite(req.body));
});

sitesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validateBody(siteSchema.partial().extend({ actif: z.boolean().optional() })),
  async (req, res) => {
    res.json(await modifierSite(req.params.id, req.body));
  }
);
