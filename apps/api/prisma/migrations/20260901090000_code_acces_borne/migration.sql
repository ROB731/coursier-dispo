ALTER TABLE "ConfigurationPlateforme" ADD COLUMN "codeBorneHash" TEXT;
ALTER TABLE "ConfigurationPlateforme" ADD COLUMN "codeBorneActif" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConfigurationPlateforme" ADD COLUMN "codeBorneAppareilId" TEXT;
ALTER TABLE "ConfigurationPlateforme" ADD COLUMN "codeBorneLieLe" TIMESTAMP(3);
