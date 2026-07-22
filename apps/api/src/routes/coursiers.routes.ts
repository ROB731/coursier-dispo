import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
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

coursiersRouter.use(requireAuth);

coursiersRouter.get("/", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  const { siteId, actifSeulement } = req.query;
  const coursiers = await listerCoursiers({
    siteId: typeof siteId === "string" ? siteId : undefined,
    actifSeulement: actifSeulement === "true",
  });
  res.json(coursiers);
});

coursiersRouter.get("/:id", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  res.json(await getCoursierParId(req.params.id));
});

coursiersRouter.post("/", requireRole("SUPER_ADMIN"), validateBody(creerCoursierSchema), async (req, res) => {
  res.status(201).json(await creerCoursier(req.body));
});

coursiersRouter.patch("/:id", requireRole("SUPER_ADMIN"), validateBody(modifierCoursierSchema), async (req, res) => {
  res.json(await modifierCoursier(req.params.id, req.body));
});

coursiersRouter.post("/:id/desactiver", requireRole("SUPER_ADMIN"), async (req, res) => {
  res.json(await desactiverCoursier(req.params.id));
});

coursiersRouter.post("/:id/reactiver", requireRole("SUPER_ADMIN"), async (req, res) => {
  res.json(await reactiverCoursier(req.params.id));
});
