import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET doit faire au moins 32 caractères"),
  JWT_EXPIRATION: z.string().default("12h"),
  FRONTEND_ORIGIN: z.string().min(1),
  SEED_SUPER_ADMIN_IDENTIFIANT: z.string().min(1).default("admin"),
  SEED_SUPER_ADMIN_MOT_DE_PASSE: z.string().min(4).default("ChangeMoiAuPremierLogin!"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_CONTACT_EMAIL: z.string().optional().default("mailto:contact@example.com"),
});

export const env = envSchema.parse(process.env);
