import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { ValidationError } from "../lib/errors";

export const uploadsRouter = Router();

export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const TYPES_AUTORISES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const extension = TYPES_AUTORISES[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!TYPES_AUTORISES[file.mimetype]) {
      cb(new ValidationError("Format d'image non supporté (jpg, png ou webp uniquement)"));
      return;
    }
    cb(null, true);
  },
});

uploadsRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

uploadsRouter.post("/photo", upload.single("photo"), (req, res) => {
  if (!req.file) throw new ValidationError("Aucun fichier reçu");
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});
