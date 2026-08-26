-- CreateEnum
CREATE TYPE "TypePageAccueil" AS ENUM ('CONNEXION', 'BORNE');

-- CreateTable
CREATE TABLE "ConfigurationPlateforme" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "pageAccueil" "TypePageAccueil" NOT NULL DEFAULT 'CONNEXION',
    "terminalAccueilId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConfigurationPlateforme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationPlateforme_terminalAccueilId_key" ON "ConfigurationPlateforme"("terminalAccueilId");

-- AddForeignKey
ALTER TABLE "ConfigurationPlateforme" ADD CONSTRAINT "ConfigurationPlateforme_terminalAccueilId_fkey" FOREIGN KEY ("terminalAccueilId") REFERENCES "Terminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve the current behavior after migration.
INSERT INTO "ConfigurationPlateforme" ("id", "pageAccueil", "updatedAt")
VALUES ('global', 'CONNEXION', CURRENT_TIMESTAMP);