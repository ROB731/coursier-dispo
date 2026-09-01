import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { getParametres, modifierParametres } from "../services/parametresService";
import { ValidationError } from "../lib/errors";
import { getConfigurationAccueil, modifierConfigurationAccueil } from "../services/configurationPlateformeService";
import {
  activerCodeBorne,
  delierAppareilBorne,
  genererCodeBorne,
  getStatutCodeBorne,
} from "../services/codeBorneService";

export const parametresRouter = Router();

parametresRouter.use(requireAuth, chargerPerimetre);

parametresRouter.get("/", async (req, res) => {
  const { entrepriseId } = req.query;
  if (typeof entrepriseId !== "string") throw new ValidationError("entrepriseId requis");
  res.json(await getParametres(entrepriseId, req.entreprisesAccessibles ?? null));
});

const parametresSchema = z.object({
  entrepriseId: z.string().uuid(),
  modeMultiSite: z.boolean().optional(),
  fenetreAnnulationBorneMinutes: z.number().int().positive().optional(),
  intervallePollingSecondes: z.number().int().positive().optional(),
  clotureAutoActive: z.boolean().optional(),
});

parametresRouter.patch(
  "/",
  requireRole("SUPER_ADMIN", "DIRECTEUR"),
  validateBody(parametresSchema),
  journaliser("Modification des paramètres", (req) => req.body?.entrepriseId),
  async (req, res) => {
    const { entrepriseId, ...donnees } = req.body;
    res.json(await modifierParametres(entrepriseId, donnees, req.entreprisesAccessibles ?? null, req.utilisateur!.role));
  }
);

parametresRouter.get("/accueil", async (_req, res) => {
  res.json(await getConfigurationAccueil());
});

const accueilSchema = z.object({
  pageAccueil: z.enum(["CONNEXION", "BORNE"]),
  terminalAccueilId: z.string().uuid().nullable(),
  notificationsBorneActives: z.boolean(),
});

parametresRouter.patch(
  "/accueil",
  requireRole("SUPER_ADMIN"),
  validateBody(accueilSchema),
  journaliser("Modification de la page d'accueil"),
  async (req, res) => {
    res.json(await modifierConfigurationAccueil(req.body));
  }
);

// ---------- Code d'accès permanent de la borne (gardien) ----------
// Réservé au Super Admin : lui seul génère/active/désactive ce code et peut
// délier l'appareil auquel il est attaché. Voir codeBorneService pour le
// détail du modèle (un seul code global, lié au premier appareil qui s'en sert).

parametresRouter.get("/code-borne", requireRole("SUPER_ADMIN"), async (_req, res) => {
  res.json(await getStatutCodeBorne());
});

parametresRouter.post(
  "/code-borne/generer",
  requireRole("SUPER_ADMIN"),
  journaliser("Génération d'un nouveau code d'accès borne"),
  async (_req, res) => {
    res.status(201).json(await genererCodeBorne());
  }
);

const activationCodeBorneSchema = z.object({ actif: z.boolean() });

parametresRouter.patch(
  "/code-borne/actif",
  requireRole("SUPER_ADMIN"),
  validateBody(activationCodeBorneSchema),
  journaliser("Activation/désactivation du code d'accès borne"),
  async (req, res) => {
    res.json(await activerCodeBorne(req.body.actif));
  }
);

parametresRouter.post(
  "/code-borne/delier",
  requireRole("SUPER_ADMIN"),
  journaliser("Déliaison de l'appareil du code d'accès borne"),
  async (_req, res) => {
    res.json(await delierAppareilBorne());
  }
);
