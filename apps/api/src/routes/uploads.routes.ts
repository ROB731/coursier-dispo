import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { ValidationError } from "../lib/errors";
import { env } from "../env";

export const uploadsRouter = Router();

export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const TYPES_AUTORISES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Sur les environnements sans disque persistant (Vercel), un store Vercel Blob
// rattaché au projet expose ce token — on bascule automatiquement dessus.
// Sinon (local, Render avec disque), on garde le stockage local existant.
const EST_VERCEL = process.env.VERCEL === "1";
const UTILISE_BLOB = EST_VERCEL || Boolean(env.BLOB_READ_WRITE_TOKEN);

const storage = UTILISE_BLOB
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, cb) => {
        const extension = TYPES_AUTORISES[file.mimetype] ?? path.extname(file.originalname);
        cb(null, `${crypto.randomUUID()}${extension}`);
      },
    });

const upload = multer({
  storage,
  // 5 Mo était trop bas pour une vraie photo de téléphone (souvent 5-10 Mo
  // en pleine résolution) — 20 Mo laisse de la marge côté serveur ; la
  // conversion HEIC->JPEG côté navigateur réduit déjà la taille en amont.
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!TYPES_AUTORISES[file.mimetype]) {
      cb(new ValidationError("Format d'image non supporté (jpg, png ou webp uniquement)"));
      return;
    }
    cb(null, true);
  },
});

uploadsRouter.use(requireAuth, requireRole("SUPER_ADMIN", "DIRECTEUR", "GERANTE"));

uploadsRouter.post("/photo", upload.single("photo"), async (req, res) => {
  if (!req.file) throw new ValidationError("Aucun fichier reçu");

  if (UTILISE_BLOB) {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      res.status(503).json({ error: "Stockage des photos non configuré sur Vercel" });
      return;
    }

    const { put } = await import("@vercel/blob");
    const extension = TYPES_AUTORISES[req.file.mimetype] ?? path.extname(req.file.originalname);
    const blob = await put(`${crypto.randomUUID()}${extension}`, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    res.status(201).json({ url: blob.url });
    return;
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});
