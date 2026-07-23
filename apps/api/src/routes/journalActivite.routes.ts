import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { listerActivite } from "../services/journalActiviteService";

export const journalActiviteRouter = Router();

// Réservé au Super Admin pour l'instant : le journal n'étant pas encore
// systématiquement rattaché à une entreprise sur chaque action, l'exposer à
// un Directeur risquerait de lui montrer de l'activité d'autres entreprises.
journalActiviteRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

journalActiviteRouter.get("/", async (_req, res) => {
  res.json(await listerActivite());
});
