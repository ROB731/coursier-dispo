import type { IncomingMessage, ServerResponse } from "http";
import { app } from "../src/app";

// Point d'entrée Vercel : chaque requête (quel que soit le chemin, voir
// vercel.json) est routée ici. L'app Express reste inchangée — c'est un
// adaptateur, pas une réécriture. server.ts (app.listen + cron interne)
// n'est utilisé que par Render/local, jamais par Vercel.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  app(req, res);
}
