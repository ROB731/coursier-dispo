import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { chargerPerimetre } from "../middleware/perimetre";
import { journaliser } from "../middleware/journalActivite";
import { ValidationError } from "../lib/errors";
import {
  creerUtilisateur,
  desactiverUtilisateur,
  listerDirecteursAccessibles,
  listerUtilisateurs,
  modifierUtilisateur,
  reactiverUtilisateur,
  reinitialiserMotDePasse,
} from "../services/utilisateurService";

export const utilisateursRouter = Router();

const roleEnum = z.enum(["SUPER_ADMIN", "DIRECTEUR", "GERANTE"]);

const creerUtilisateurSchema = z.object({
  identifiant: z.string().min(3),
  motDePasse: z.string().min(4),
  role: roleEnum,
  nomComplet: z.string().min(1),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  siteParDefautId: z.string().uuid().optional(),
  entrepriseIds: z.array(z.string().uuid()).optional(),
  entrepriseId: z.string().uuid().optional(),
  directeurId: z.string().uuid().optional(),
});

const modifierUtilisateurSchema = z.object({
  nomComplet: z.string().min(1).optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  siteParDefautId: z.string().uuid().optional(),
  entrepriseIds: z.array(z.string().uuid()).optional(),
  entrepriseId: z.string().uuid().optional(),
  directeurId: z.string().uuid().optional(),
});

utilisateursRouter.use(requireAuth, chargerPerimetre, requireRole("SUPER_ADMIN", "DIRECTEUR"));

utilisateursRouter.get("/", async (req, res) => {
  res.json(await listerUtilisateurs(req.entreprisesAccessibles ?? null));
});

// Liste des directeurs accessibles, pour le sélecteur "rattacher à un directeur" à la création d'un Gérant.
utilisateursRouter.get("/directeurs", async (req, res) => {
  res.json(await listerDirecteursAccessibles(req.entreprisesAccessibles ?? null));
});

utilisateursRouter.post(
  "/",
  validateBody(creerUtilisateurSchema),
  journaliser("Création d'un compte", (req) => req.body?.identifiant),
  async (req, res) => {
    res.status(201).json(
      await creerUtilisateur(req.body, req.utilisateur!.role, req.entreprisesAccessibles ?? null)
    );
  }
);

utilisateursRouter.patch(
  "/:id",
  validateBody(modifierUtilisateurSchema),
  journaliser("Modification d'un compte", (req) => req.params.id),
  async (req, res) => {
    res.json(
      await modifierUtilisateur(req.params.id, req.body, req.utilisateur!.role, req.entreprisesAccessibles ?? null)
    );
  }
);

utilisateursRouter.post(
  "/:id/reinitialiser-mot-de-passe",
  validateBody(z.object({ motDePasse: z.string().min(4) })),
  journaliser("Réinitialisation d'un mot de passe", (req) => req.params.id),
  async (req, res) => {
    await reinitialiserMotDePasse(req.params.id, req.body.motDePasse, req.utilisateur!.role, req.entreprisesAccessibles ?? null);
    res.status(204).send();
  }
);

utilisateursRouter.post(
  "/:id/desactiver",
  journaliser("Désactivation d'un compte", (req) => req.params.id),
  async (req, res) => {
    if (req.params.id === req.utilisateur!.id) {
      throw new ValidationError("Vous ne pouvez pas désactiver votre propre compte");
    }
    res.json(await desactiverUtilisateur(req.params.id, req.utilisateur!.role, req.entreprisesAccessibles ?? null));
  }
);

utilisateursRouter.post(
  "/:id/reactiver",
  journaliser("Réactivation d'un compte", (req) => req.params.id),
  async (req, res) => {
    res.json(await reactiverUtilisateur(req.params.id, req.utilisateur!.role, req.entreprisesAccessibles ?? null));
  }
);
