import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import {
  creerCoursier,
  desactiverCoursier,
  getCoursierParId,
  listerCoursiers,
  modifierCoursier,
  reactiverCoursier,
} from "../services/coursierService";

export const coursiersRouter = Router();

const typeContratEnum = z.enum(["CDI", "CDD", "STAGIAIRE", "PRESTATAIRE"]);

const creerCoursierSchema = z.object({
  code: z.string().min(1),
  photoUrl: z.string().min(1),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  dateNaissance: z.coerce.date().optional(),
  adresse: z.string().optional(),
  typeContrat: typeContratEnum.optional(),
  dateEmbauche: z.coerce.date().optional(),
  contactUrgenceNom: z.string().optional(),
  contactUrgenceTelephone: z.string().optional(),
  profilHoraireId: z.string().uuid(),
  notes: z.string().optional(),
  siteId: z.string().uuid(),
});

const modifierCoursierSchema = creerCoursierSchema.omit({ siteId: true }).partial();

coursiersRouter.use(requireAuth, chargerPerimetre);

coursiersRouter.get("/", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  const { siteId, actifSeulement, entrepriseId } = req.query;
  const coursiers = await listerCoursiers(
    {
      siteId: typeof siteId === "string" ? siteId : undefined,
      actifSeulement: actifSeulement === "true",
      entrepriseId: typeof entrepriseId === "string" ? entrepriseId : undefined,
    },
    req.entreprisesAccessibles ?? null
  );
  res.json(coursiers);
});

coursiersRouter.get("/:id", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  res.json(await getCoursierParId(req.params.id, req.entreprisesAccessibles ?? null));
});

coursiersRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(creerCoursierSchema),
  journaliser("Création d'un coursier", (req) => req.body?.code),
  async (req, res) => {
    res.status(201).json(await creerCoursier(req.body, req.entreprisesAccessibles ?? null));
  }
);

coursiersRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  validateBody(modifierCoursierSchema),
  journaliser("Modification d'un coursier", (req) => req.body?.code ?? req.params.id),
  async (req, res) => {
    res.json(await modifierCoursier(req.params.id, req.body, req.entreprisesAccessibles ?? null));
  }
);

coursiersRouter.post(
  "/:id/desactiver",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  journaliser("Désactivation d'un coursier", (req) => req.params.id),
  async (req, res) => {
    res.json(await desactiverCoursier(req.params.id, req.entreprisesAccessibles ?? null));
  }
);

coursiersRouter.post(
  "/:id/reactiver",
  requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"),
  journaliser("Réactivation d'un coursier", (req) => req.params.id),
  async (req, res) => {
    res.json(await reactiverCoursier(req.params.id, req.entreprisesAccessibles ?? null));
  }
);
