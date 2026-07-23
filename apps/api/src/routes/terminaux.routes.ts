import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { creerTerminal, listerTerminaux, modifierTerminal } from "../services/terminalService";

export const terminauxRouter = Router();

const terminalSchema = z.object({
  nom: z.string().min(1),
  siteId: z.string().uuid(),
});

terminauxRouter.use(requireAuth, chargerPerimetre);

terminauxRouter.get("/", requireRole("SUPER_ADMIN", "DIRECTEUR"), async (req, res) => {
  res.json(await listerTerminaux(req.entreprisesAccessibles ?? null));
});

terminauxRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(terminalSchema),
  journaliser("Création d'une borne", (req) => req.body?.nom),
  async (req, res) => {
    res.status(201).json(await creerTerminal(req.body, req.entreprisesAccessibles ?? null));
  }
);

terminauxRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(terminalSchema.partial().extend({ actif: z.boolean().optional() })),
  journaliser("Modification d'une borne", (req) => req.params.id),
  async (req, res) => {
    res.json(await modifierTerminal(req.params.id, req.body, req.entreprisesAccessibles ?? null));
  }
);
