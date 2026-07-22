import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { validateBody } from "../middleware/validate";
import { listerCoursiers } from "../services/coursierService";
import { calculerStatut } from "../services/statutService";
import { annulerEvenement, creerEvenementBorne } from "../services/evenementService";

export const bornesRouter = Router();

declare module "express-serve-static-core" {
  interface Request {
    terminal?: { id: string; siteId: string; nom: string };
  }
}

async function chargerTerminal(req: Request, _res: Response, next: NextFunction) {
  const terminal = await prisma.terminal.findUnique({ where: { id: req.params.terminalId } });
  if (!terminal || !terminal.actif) throw new NotFoundError("Borne inconnue ou désactivée");
  req.terminal = { id: terminal.id, siteId: terminal.siteId, nom: terminal.nom };
  next();
}

bornesRouter.use("/:terminalId", chargerTerminal);

// Grille principale de la borne : coursiers actifs du site + statut courant
// (pour pré-sélectionner l'action contextuelle Entrée/Sortie côté UI).
bornesRouter.get("/:terminalId/coursiers", async (req, res) => {
  const coursiers = await listerCoursiers({ siteId: req.terminal!.siteId, actifSeulement: true });
  const avecStatut = await Promise.all(
    coursiers.map(async (c) => ({
      id: c.id,
      code: c.code,
      prenom: c.prenom,
      nom: c.nom,
      photoUrl: c.photoUrl,
      statut: await calculerStatut(c.id),
    }))
  );
  res.json({ terminal: req.terminal, coursiers: avecStatut });
});

const creerEvenementSchema = z.object({
  coursierId: z.string().uuid(),
  type: z.enum(["ENTREE", "SORTIE"]),
});

bornesRouter.post("/:terminalId/evenements", validateBody(creerEvenementSchema), async (req, res) => {
  const evenement = await creerEvenementBorne({
    coursierId: req.body.coursierId,
    type: req.body.type,
    terminalId: req.terminal!.id,
  });
  res.status(201).json(evenement);
});

bornesRouter.post("/:terminalId/evenements/:id/annuler", async (req, res) => {
  const annulation = await annulerEvenement({
    evenementId: req.params.id,
    source: "BORNE",
    terminalId: req.terminal!.id,
  });
  res.status(201).json(annulation);
});
