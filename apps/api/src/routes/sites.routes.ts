import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { creerSite, listerSites, modifierSite } from "../services/siteService";

export const sitesRouter = Router();

const siteSchema = z.object({
  nom: z.string().min(1),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  entrepriseId: z.string().uuid(),
});

sitesRouter.use(requireAuth, chargerPerimetre);

sitesRouter.get("/", async (req, res) => {
  const { entrepriseId } = req.query;
  res.json(await listerSites(req.entreprisesAccessibles ?? null, typeof entrepriseId === "string" ? entrepriseId : undefined));
});

sitesRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(siteSchema),
  journaliser("Création d'un site", (req) => req.body?.nom),
  async (req, res) => {
    res.status(201).json(await creerSite(req.body, req.entreprisesAccessibles ?? null));
  }
);

sitesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(siteSchema.partial().omit({ entrepriseId: true }).extend({ actif: z.boolean().optional() })),
  journaliser("Modification d'un site", (req) => req.params.id),
  async (req, res) => {
    res.json(await modifierSite(req.params.id, req.body, req.entreprisesAccessibles ?? null));
  }
);
