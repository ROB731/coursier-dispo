-- CreateTable
CREATE TABLE "JournalActivite" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "nomUtilisateur" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cible" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalActivite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalActivite_utilisateurId_createdAt_idx" ON "JournalActivite"("utilisateurId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalActivite_createdAt_idx" ON "JournalActivite"("createdAt");

-- AddForeignKey
ALTER TABLE "JournalActivite" ADD CONSTRAINT "JournalActivite_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
