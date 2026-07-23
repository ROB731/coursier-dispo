import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { creerEntreprise, listerEntreprises, modifierEntreprise } from "../services/entrepriseService";

export const entreprisesRouter = Router();

const entrepriseSchema = z.object({ nom: z.string().min(1) });

entreprisesRouter.use(requireAuth, chargerPerimetre);

// Toute personne connectée voit les entreprises de son périmètre (nécessaire
// pour les sélecteurs d'entreprise dans l'UI Directeur/Gérante).
entreprisesRouter.get("/", async (req, res) => {
  res.json(await listerEntreprises(req.entreprisesAccessibles ?? null));
});

entreprisesRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validateBody(entrepriseSchema),
  journaliser("Création d'une entreprise", (req) => req.body?.nom),
  async (req, res) => {
    res.status(201).json(await creerEntreprise(req.body));
  }
);

entreprisesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validateBody(entrepriseSchema.partial().extend({ actif: z.boolean().optional() })),
  journaliser("Modification d'une entreprise", (req) => req.params.id),
  async (req, res) => {
    res.json(await modifierEntreprise(req.params.id, req.body));
  }
);
