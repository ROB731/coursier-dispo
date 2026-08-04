import { Router } from "express";
import { env } from "../env";
import { UnauthorizedError } from "../lib/errors";
import { executerClotureAutomatique } from "../jobs/clotureAutomatique";

export const cronRouter = Router();

/**
 * Destinée à un planificateur externe (ex. Vercel Cron) sur les environnements
 * sans process persistant. Complémentaire au déclenchement au login et au
 * cron interne (Render/local) — idempotent, sans conflit entre les trois.
 */
cronRouter.get("/cloture", async (req, res) => {
  if (!env.CRON_SECRET || req.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    throw new UnauthorizedError("Accès refusé");
  }
  await executerClotureAutomatique();
  res.json({ ok: true });
});
