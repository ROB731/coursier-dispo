import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { chargerPerimetre } from "../middleware/perimetre";
import { getStatutsSite } from "../services/statutService";
import { getSiteParId } from "../services/siteService";

export const statutsRouter = Router();

statutsRouter.use(requireAuth, chargerPerimetre);

statutsRouter.get("/sites/:siteId", requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"), async (req, res) => {
  await getSiteParId(req.params.siteId, req.entreprisesAccessibles ?? null);
  res.json(await getStatutsSite(req.params.siteId));
});
