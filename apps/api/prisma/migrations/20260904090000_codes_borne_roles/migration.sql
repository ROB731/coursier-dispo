CREATE TYPE "RoleCodeBorne" AS ENUM ('GARDIEN', 'CONSULTATION');

ALTER TABLE "CodeAccesBorne" ADD COLUMN "role" "RoleCodeBorne" NOT NULL DEFAULT 'GARDIEN';
ALTER TABLE "CodeAccesBorne" ADD COLUMN "code" TEXT;
ALTER TABLE "CodeAccesBorne" ADD COLUMN "utilisateurId" TEXT;

CREATE UNIQUE INDEX "CodeAccesBorne_utilisateurId_key" ON "CodeAccesBorne"("utilisateurId");

ALTER TABLE "CodeAccesBorne" ADD CONSTRAINT "CodeAccesBorne_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
