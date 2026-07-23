-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('SUPER_ADMIN', 'DIRECTEUR', 'GERANTE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'STAGIAIRE', 'PRESTATAIRE');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM');

-- CreateEnum
CREATE TYPE "TypeEvenement" AS ENUM ('ENTREE', 'SORTIE', 'ANNULATION', 'CLOTURE_AUTO');

-- CreateEnum
CREATE TYPE "SourceEvenement" AS ENUM ('BORNE', 'COMPTE', 'SYSTEME');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('COURSIER_ARRIVE', 'AUCUN_DISPONIBLE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL,
    "nomComplet" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "siteParDefautId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConnexionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT,
    "estSitePrincipal" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terminal" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "derniereActiviteAt" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coursier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "dateNaissance" DATE,
    "adresse" TEXT,
    "typeContrat" "TypeContrat",
    "dateEmbauche" DATE,
    "contactUrgenceNom" TEXT,
    "contactUrgenceTelephone" TEXT,
    "statutActif" BOOLEAN NOT NULL DEFAULT true,
    "profilHoraireId" TEXT NOT NULL,
    "multiSiteActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coursier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursierSite" (
    "id" TEXT NOT NULL,
    "coursierId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "estSitePrincipal" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoursierSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilHoraire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "joursApplicables" "JourSemaine"[],
    "estParDefaut" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfilHoraire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "coursierId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "TypeEvenement" NOT NULL,
    "evenementAnnuleId" TEXT,
    "source" "SourceEvenement" NOT NULL,
    "terminalId" TEXT,
    "creeParUtilisateurId" TEXT,
    "horodatage" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "coursierId" TEXT,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "envoyeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametresApplication" (
    "id" TEXT NOT NULL,
    "modeMultiSite" BOOLEAN NOT NULL DEFAULT false,
    "fenetreAnnulationBorneMinutes" INTEGER NOT NULL DEFAULT 2,
    "intervallePollingSecondes" INTEGER NOT NULL DEFAULT 7,
    "clotureAutoActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ParametresApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_identifiant_key" ON "Utilisateur"("identifiant");

-- CreateIndex
CREATE INDEX "Utilisateur_role_idx" ON "Utilisateur"("role");

-- CreateIndex
CREATE INDEX "Site_actif_idx" ON "Site"("actif");

-- CreateIndex
CREATE INDEX "Terminal_siteId_idx" ON "Terminal"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Coursier_code_key" ON "Coursier"("code");

-- CreateIndex
CREATE INDEX "Coursier_statutActif_idx" ON "Coursier"("statutActif");

-- CreateIndex
CREATE INDEX "Coursier_profilHoraireId_idx" ON "Coursier"("profilHoraireId");

-- CreateIndex
CREATE INDEX "CoursierSite_siteId_idx" ON "CoursierSite"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursierSite_coursierId_siteId_key" ON "CoursierSite"("coursierId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Evenement_evenementAnnuleId_key" ON "Evenement"("evenementAnnuleId");

-- CreateIndex
CREATE INDEX "Evenement_coursierId_horodatage_idx" ON "Evenement"("coursierId", "horodatage");

-- CreateIndex
CREATE INDEX "Evenement_siteId_horodatage_idx" ON "Evenement"("siteId", "horodatage");

-- CreateIndex
CREATE INDEX "Evenement_type_idx" ON "Evenement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "Notification_utilisateurId_lu_idx" ON "Notification"("utilisateurId", "lu");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_siteParDefautId_fkey" FOREIGN KEY ("siteParDefautId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coursier" ADD CONSTRAINT "Coursier_profilHoraireId_fkey" FOREIGN KEY ("profilHoraireId") REFERENCES "ProfilHoraire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursierSite" ADD CONSTRAINT "CoursierSite_coursierId_fkey" FOREIGN KEY ("coursierId") REFERENCES "Coursier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursierSite" ADD CONSTRAINT "CoursierSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_coursierId_fkey" FOREIGN KEY ("coursierId") REFERENCES "Coursier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_evenementAnnuleId_fkey" FOREIGN KEY ("evenementAnnuleId") REFERENCES "Evenement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_creeParUtilisateurId_fkey" FOREIGN KEY ("creeParUtilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_coursierId_fkey" FOREIGN KEY ("coursierId") REFERENCES "Coursier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
