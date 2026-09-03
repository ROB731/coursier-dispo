CREATE TYPE "EtatJournee" AS ENUM ('OUVERTE', 'FERMEE');

CREATE TABLE "JourneeSite" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "etat" "EtatJournee" NOT NULL,
    "demarreeLe" TIMESTAMP(3) NOT NULL,
    "fermeeLe" TIMESTAMP(3),
    "terminalId" TEXT,
    CONSTRAINT "JourneeSite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JourneeSite_siteId_date_key" ON "JourneeSite"("siteId", "date");
CREATE INDEX "JourneeSite_siteId_date_idx" ON "JourneeSite"("siteId", "date");

ALTER TABLE "JourneeSite" ADD CONSTRAINT "JourneeSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
