ALTER TABLE "Coursier" ADD COLUMN "desactiveLe" TIMESTAMP(3);
ALTER TABLE "Coursier" ADD COLUMN "archiveLe" TIMESTAMP(3);

-- Les coursiers déjà désactivés commencent leur délai à la date de migration.
UPDATE "Coursier" SET "desactiveLe" = CURRENT_TIMESTAMP WHERE "statutActif" = false AND "desactiveLe" IS NULL;

CREATE INDEX "Coursier_desactiveLe_archiveLe_idx" ON "Coursier"("desactiveLe", "archiveLe");