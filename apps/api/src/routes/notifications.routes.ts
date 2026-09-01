import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../lib/errors";
import {
  enregistrerAbonnementPush,
  listerNotifications,
  marquerCommeLue,
  marquerToutesCommeLues,
} from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.get("/borne/:terminalId", async (req, res) => {
  const terminal = await prisma.terminal.findUnique({ where: { id: req.params.terminalId } });
  if (!terminal) throw new NotFoundError("Borne introuvable");
  res.json(
    await prisma.notificationBorne.findMany({
      where: { terminalId: terminal.id },
      orderBy: { envoyeAt: "desc" },
      take: 100,
    })
  );
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

notificationsRouter.post("/subscribe", validateBody(subscribeSchema), async (req, res) => {
  res.status(201).json(await enregistrerAbonnementPush(req.utilisateur!.id, req.body));
});

const borneSubscribeSchema = subscribeSchema.extend({ terminalId: z.string().uuid() });

// Une borne n'a pas de compte utilisateur : son abonnement est donc enregistré
// séparément, après vérification de l'identité du terminal et du réglage global.
notificationsRouter.post("/borne/subscribe", validateBody(borneSubscribeSchema), async (req, res) => {
  const terminal = await prisma.terminal.findUnique({ where: { id: req.body.terminalId } });
  if (!terminal || !terminal.actif) throw new NotFoundError("Borne introuvable ou désactivée");
  const configuration = await prisma.configurationPlateforme.findUnique({ where: { id: "global" } });
  if (!configuration?.notificationsBorneActives) throw new ForbiddenError("Les notifications de borne sont désactivées");

  const { terminalId, endpoint, keys } = req.body;
  const subscription = await prisma.pushSubscriptionBorne.upsert({
    where: { endpoint },
    create: { terminalId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { terminalId, p256dh: keys.p256dh, auth: keys.auth },
  });
  res.status(201).json(subscription);
});

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  res.json(await listerNotifications(req.utilisateur!.id));
});

notificationsRouter.patch("/lu", async (req, res) => {
  await marquerToutesCommeLues(req.utilisateur!.id);
  res.status(204).send();
});

notificationsRouter.patch("/:id/lu", async (req, res) => {
  await marquerCommeLue(req.params.id, req.utilisateur!.id);
  res.status(204).send();
});
