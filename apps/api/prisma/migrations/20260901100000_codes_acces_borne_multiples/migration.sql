ALTER TABLE "ConfigurationPlateforme" DROP COLUMN "codeBorneHash";
ALTER TABLE "ConfigurationPlateforme" DROP COLUMN "codeBorneActif";
ALTER TABLE "ConfigurationPlateforme" DROP COLUMN "codeBorneAppareilId";
ALTER TABLE "ConfigurationPlateforme" DROP COLUMN "codeBorneLieLe";

CREATE TABLE "CodeAccesBorne" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "appareilId" TEXT,
    "lieLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CodeAccesBorne_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodeAccesBorne_actif_idx" ON "CodeAccesBorne"("actif");
