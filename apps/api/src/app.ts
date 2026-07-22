import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { coursiersRouter } from "./routes/coursiers.routes";
import { sitesRouter } from "./routes/sites.routes";
import { profilsHorairesRouter } from "./routes/profilsHoraires.routes";
import { bornesRouter } from "./routes/bornes.routes";
import { evenementsRouter } from "./routes/evenements.routes";
import { statutsRouter } from "./routes/statuts.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import { parametresRouter } from "./routes/parametres.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/coursiers", coursiersRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/profils-horaires", profilsHorairesRouter);
app.use("/api/bornes", bornesRouter);
app.use("/api/evenements", evenementsRouter);
app.use("/api/statuts", statutsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/parametres", parametresRouter);

app.use(errorHandler);
