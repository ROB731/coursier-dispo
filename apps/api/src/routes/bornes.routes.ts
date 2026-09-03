import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { validateBody } from "../middleware/validate";
import { listerCoursiers } from "../services/coursierService";
import { calculerStatutsDetailleParLot } from "../services/statutService";
import { annulerEvenement, creerEvenementBorne } from "../services/evenementService";
import { listerEmployesBorne, pointerEmployeBorne } from "../services/presenceEmployeService";
import { authentifierAppareilBorne, verifierAccesAppareilBorne } from "../services/codeBorneService";
import { demarrerJournee, fermerJournee, obtenirJourneeSite } from "../services/journeeService";

export const bornesRouter = Router();

// Doit être déclarée avant `bornesRouter.use("/:terminalId", chargerTerminal)`
// ci-dessous : ce middleware capture tout premier segment (y compris
// "authentifier") comme un terminalId et renverrait 404 sinon. Le code
// d'accès est global (un seul gardien pour tout le système), pas propre à
// une borne — cette route n'est donc volontairement pas imbriquée sous /:terminalId.
const authentifierSchema = z.object({
  code: z.string().min(1),
  appareilId: z.string().min(1),
});

bornesRouter.post("/authentifier", validateBody(authentifierSchema), async (req, res) => {
  await authentifierAppareilBorne(req.body.code, req.body.appareilId);
  res.status(204).send();
});

declare module "express-serve-static-core" {
  interface Request {
    terminal?: {
      id: string;
      siteId: string;
      nom: string;
      actif: boolean;
      desactiveParNom: string | null;
      desactiveLe: Date | null;
    };
  }
}

// Un point désactivé n'est pas "introuvable" : on garde le lien intact et on
// explique pourquoi il ne fonctionne plus, plutôt que de renvoyer une erreur
// générique — seul un ID de point qui n'a jamais existé est une vraie 404.
async function chargerTerminal(req: Request, _res: Response, next: NextFunction) {
  const terminal = await prisma.terminal.findUnique({ where: { id: req.params.terminalId } });
  if (!terminal) throw new NotFoundError("Point inconnu");
  req.terminal = {
    id: terminal.id,
    siteId: terminal.siteId,
    nom: terminal.nom,
    actif: terminal.actif,
    desactiveParNom: terminal.desactiveParNom,
    desactiveLe: terminal.desactiveLe,
  };
  next();
}

bornesRouter.use("/:terminalId", chargerTerminal);

// Grille principale de la borne : coursiers actifs du site + statut courant
// (pour pré-sélectionner l'action contextuelle Entrée/Sortie côté UI).
bornesRouter.get("/:terminalId/coursiers", async (req, res) => {
  if (!req.terminal!.actif) {
    res.json({
      terminal: req.terminal,
      desactive: true,
      desactiveParNom: req.terminal!.desactiveParNom,
      desactiveLe: req.terminal!.desactiveLe,
      coursiers: [],
      journee: null,
    });
    return;
  }

  const coursiers = await listerCoursiers({ siteId: req.terminal!.siteId, actifSeulement: true });
  const details = await calculerStatutsDetailleParLot(coursiers);
  const avecStatut = coursiers.map((c) => {
    const detail = details.get(c.id)!;
    return {
      id: c.id,
      code: c.code,
      prenom: c.prenom,
      nom: c.nom,
      photoUrl: c.photoUrl,
      statut: detail.statut,
      horsPlageHoraire: detail.horsPlageHoraire,
      journeeTerminee: detail.journeeTerminee,
      depuis: detail.depuis,
    };
  });
  const journee = await obtenirJourneeSite(req.terminal!.siteId);
  res.json({ terminal: req.terminal, desactive: false, coursiers: avecStatut, journee });
});

const actionJourneeSchema = z.object({ appareilId: z.string().optional() });

bornesRouter.post("/:terminalId/journee/demarrer", validateBody(actionJourneeSchema), async (req, res) => {
  if (!req.terminal!.actif) throw new ForbiddenError("Ce point a été désactivé");
  await verifierAccesAppareilBorne(req.body.appareilId, true);
  res.status(201).json(await demarrerJournee(req.terminal!.siteId, req.terminal!.id));
});

bornesRouter.post("/:terminalId/journee/fermer", validateBody(actionJourneeSchema), async (req, res) => {
  if (!req.terminal!.actif) throw new ForbiddenError("Ce point a été désactivé");
  await verifierAccesAppareilBorne(req.body.appareilId, true);
  res.status(201).json(await fermerJournee(req.terminal!.siteId, req.terminal!.id));
});

const creerEvenementSchema = z.object({
  coursierId: z.string().uuid(),
  type: z.enum(["ENTREE", "SORTIE"]),
  appareilId: z.string().optional(),
});

bornesRouter.post("/:terminalId/evenements", validateBody(creerEvenementSchema), async (req, res) => {
  if (!req.terminal!.actif) throw new ForbiddenError("Ce point a été désactivé");
  await verifierAccesAppareilBorne(req.body.appareilId);
  const evenement = await creerEvenementBorne({
    coursierId: req.body.coursierId,
    type: req.body.type,
    terminalId: req.terminal!.id,
  });
  res.status(201).json(evenement);
});

const annulerEvenementSchema = z.object({ appareilId: z.string().optional() });

bornesRouter.post("/:terminalId/evenements/:id/annuler", validateBody(annulerEvenementSchema), async (req, res) => {
  if (!req.terminal!.actif) throw new ForbiddenError("Ce point a été désactivé");
  await verifierAccesAppareilBorne(req.body.appareilId);
  const annulation = await annulerEvenement({
    evenementId: req.params.id,
    source: "BORNE",
    terminalId: req.terminal!.id,
  });
  res.status(201).json(annulation);
});

// ---------- Employés (onglet séparé sur l'écran de la borne) ----------

bornesRouter.get("/:terminalId/employes", async (req, res) => {
  if (!req.terminal!.actif) {
    res.json({ terminal: req.terminal, desactive: true, employes: [] });
    return;
  }
  const employes = await listerEmployesBorne(req.terminal!.siteId);
  res.json({ terminal: req.terminal, desactive: false, employes });
});

const pointageEmployeSchema = z.object({
  employeId: z.string().uuid(),
  type: z.enum(["ENTREE", "SORTIE"]),
});

bornesRouter.post("/:terminalId/employes/pointage", validateBody(pointageEmployeSchema), async (req, res) => {
  if (!req.terminal!.actif) throw new ForbiddenError("Ce point a été désactivé");
  const resultat = await pointerEmployeBorne(req.body.employeId, req.terminal!.siteId, req.body.type);
  res.status(201).json(resultat);
});
