import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import {
  creerEmploye,
  desactiverEmploye,
  getEmployeParId,
  listerEmployes,
  modifierEmploye,
  reactiverEmploye,
} from "../services/employeService";

export const employesRouter = Router();

const creerEmployeSchema = z.object({
  entrepriseId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  poste: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().optional(),
});

const modifierEmployeSchema = creerEmployeSchema.omit({ entrepriseId: true }).partial();

employesRouter.use(requireAuth, chargerPerimetre, requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"));

employesRouter.get("/", async (req, res) => {
  const { entrepriseId, siteId, actifSeulement } = req.query;
  const employes = await listerEmployes(req.entreprisesAccessibles ?? null, {
    entrepriseId: typeof entrepriseId === "string" ? entrepriseId : undefined,
    siteId: typeof siteId === "string" ? siteId : undefined,
    actifSeulement: actifSeulement === "true",
  });
  res.json(employes);
});

employesRouter.get("/:id", async (req, res) => {
  res.json(await getEmployeParId(req.params.id, req.entreprisesAccessibles ?? null));
});

employesRouter.post(
  "/",
  validateBody(creerEmployeSchema),
  journaliser("Création d'un employé", (req) => `${req.body?.prenom} ${req.body?.nom}`),
  async (req, res) => {
    res.status(201).json(await creerEmploye(req.body, req.entreprisesAccessibles ?? null));
  }
);

employesRouter.patch(
  "/:id",
  validateBody(modifierEmployeSchema),
  journaliser("Modification d'un employé", (req) => req.params.id),
  async (req, res) => {
    res.json(await modifierEmploye(req.params.id, req.body, req.entreprisesAccessibles ?? null));
  }
);

employesRouter.post(
  "/:id/desactiver",
  journaliser("Désactivation d'un employé", (req) => req.params.id),
  async (req, res) => {
    res.json(await desactiverEmploye(req.params.id, req.entreprisesAccessibles ?? null));
  }
);

employesRouter.post(
  "/:id/reactiver",
  journaliser("Réactivation d'un employé", (req) => req.params.id),
  async (req, res) => {
    res.json(await reactiverEmploye(req.params.id, req.entreprisesAccessibles ?? null));
  }
);
