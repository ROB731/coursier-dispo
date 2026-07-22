import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { enregistrerAbonnementPush, listerNotifications, marquerCommeLue } from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  res.json(await listerNotifications(req.utilisateur!.id));
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

notificationsRouter.post("/subscribe", validateBody(subscribeSchema), async (req, res) => {
  res.status(201).json(await enregistrerAbonnementPush(req.utilisateur!.id, req.body));
});

notificationsRouter.patch("/:id/lu", async (req, res) => {
  await marquerCommeLue(req.params.id, req.utilisateur!.id);
  res.status(204).send();
});
