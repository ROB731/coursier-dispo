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
  delierAppareilCodeBorne,
  genererCodeConsultation,
  genererCodeGardien,
  listerCodesBorne,
  supprimerCodeBorne,
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

// ---------- Codes d'accès permanents de la borne ----------
// Réservé au Super Admin : lui seul crée/active/désactive/supprime ces codes
// et peut délier l'appareil auquel chacun est attaché. Plusieurs codes
// peuvent coexister (un par borne ou par personne autorisée) — voir
// codeBorneService pour le détail du modèle.

parametresRouter.get("/codes-borne", requireRole("SUPER_ADMIN"), async (_req, res) => {
  res.json(await listerCodesBorne());
});

const creerCodeGardienSchema = z.object({ nom: z.string().trim().min(1, "Un nom est requis") });

parametresRouter.post(
  "/codes-borne",
  requireRole("SUPER_ADMIN"),
  validateBody(creerCodeGardienSchema),
  journaliser("Création d'un code d'accès borne (gardien)", (req) => req.body?.nom),
  async (req, res) => {
    res.status(201).json(await genererCodeGardien(req.body.nom));
  }
);

const creerCodeConsultationSchema = z.object({ utilisateurId: z.string().uuid() });

parametresRouter.post(
  "/codes-borne/consultation",
  requireRole("SUPER_ADMIN"),
  validateBody(creerCodeConsultationSchema),
  journaliser("Création d'un code d'accès borne (consultation)", (req) => req.body?.utilisateurId),
  async (req, res) => {
    res.status(201).json(await genererCodeConsultation(req.body.utilisateurId));
  }
);

const activationCodeBorneSchema = z.object({ actif: z.boolean() });

parametresRouter.patch(
  "/codes-borne/:id/actif",
  requireRole("SUPER_ADMIN"),
  validateBody(activationCodeBorneSchema),
  journaliser("Activation/désactivation d'un code d'accès borne", (req) => req.params.id),
  async (req, res) => {
    res.json(await activerCodeBorne(req.params.id, req.body.actif));
  }
);

parametresRouter.post(
  "/codes-borne/:id/delier",
  requireRole("SUPER_ADMIN"),
  journaliser("Déliaison de l'appareil d'un code d'accès borne", (req) => req.params.id),
  async (req, res) => {
    res.json(await delierAppareilCodeBorne(req.params.id));
  }
);

parametresRouter.delete(
  "/codes-borne/:id",
  requireRole("SUPER_ADMIN"),
  journaliser("Suppression d'un code d'accès borne", (req) => req.params.id),
  async (req, res) => {
    res.json(await supprimerCodeBorne(req.params.id));
  }
);
