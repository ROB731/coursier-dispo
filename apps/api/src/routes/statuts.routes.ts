import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { getStatutsSite } from "../services/statutService";

export const statutsRouter = Router();

statutsRouter.use(requireAuth);

statutsRouter.get("/sites/:siteId", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  res.json(await getStatutsSite(req.params.siteId));
});
