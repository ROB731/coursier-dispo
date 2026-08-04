import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody, validateQuery } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { getRegistreDuJour, getRegistrePresence, marquerPresence } from "../services/presenceEmployeService";

export const presencesEmployesRouter = Router();

const statutEnum = z.enum(["PRESENT", "ABSENT"]);
const typeAbsenceEnum = z.enum(["CONGE_PAYE", "MALADIE", "CONGE_SANS_SOLDE", "AUTRE"]);

const marquerSchema = z.object({
  employeId: z.string().uuid(),
  date: z.coerce.date(),
  statut: statutEnum,
  typeAbsence: typeAbsenceEnum.optional(),
  commentaire: z.string().optional(),
});

const registreDuJourQuerySchema = z.object({
  date: z.coerce.date(),
  entrepriseId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
});

const registreQuerySchema = z.object({
  entrepriseId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  employeId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  depuis: z.coerce.date().optional(),
  jusqua: z.coerce.date().optional(),
});

presencesEmployesRouter.use(requireAuth, chargerPerimetre, requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"));

presencesEmployesRouter.get("/jour", validateQuery(registreDuJourQuerySchema), async (req, res) => {
  const { date, entrepriseId, siteId } = req.query as unknown as z.infer<typeof registreDuJourQuerySchema>;
  res.json(await getRegistreDuJour(date, { entrepriseId, siteId }, req.entreprisesAccessibles ?? null));
});

presencesEmployesRouter.get("/", validateQuery(registreQuerySchema), async (req, res) => {
  const filtres = req.query as unknown as z.infer<typeof registreQuerySchema>;
  res.json(await getRegistrePresence(filtres, req.entreprisesAccessibles ?? null));
});

presencesEmployesRouter.post(
  "/",
  validateBody(marquerSchema),
  journaliser("Pointage de présence d'un employé", (req) => req.body?.employeId),
  async (req, res) => {
    const resultat = await marquerPresence(
      req.body,
      { id: req.utilisateur!.id, nomComplet: req.utilisateur!.nomComplet },
      req.entreprisesAccessibles ?? null
    );
    res.status(201).json(resultat);
  }
);
