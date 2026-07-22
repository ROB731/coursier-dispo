import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const site = await prisma.site.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nom: "Siège",
      estSitePrincipal: true,
    },
  });

  const profilParDefaut = await prisma.profilHoraire.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      nom: "Journée complète",
      heureDebut: "08:00",
      heureFin: "17:30",
      joursApplicables: ["LUN", "MAR", "MER", "JEU", "VEN", "SAM"],
      estParDefaut: true,
    },
  });

  const parametresExistants = await prisma.parametresApplication.findFirst();
  if (!parametresExistants) {
    await prisma.parametresApplication.create({
      data: {
        modeMultiSite: false,
        fenetreAnnulationBorneMinutes: 2,
        intervallePollingSecondes: 7,
        clotureAutoActive: true,
      },
    });
  }

  const identifiant = process.env.SEED_SUPER_ADMIN_IDENTIFIANT ?? "admin";
  const motDePasse = process.env.SEED_SUPER_ADMIN_MOT_DE_PASSE ?? "ChangeMoiAuPremierLogin!";

  const superAdminExistant = await prisma.utilisateur.findUnique({ where: { identifiant } });
  if (!superAdminExistant) {
    await prisma.utilisateur.create({
      data: {
        identifiant,
        motDePasseHash: await bcrypt.hash(motDePasse, 12),
        role: "SUPER_ADMIN",
        nomComplet: "Super Administrateur",
        siteParDefautId: site.id,
      },
    });
    console.log(`Compte Super Administrateur créé : ${identifiant} (changez le mot de passe dès la première connexion)`);
  }

  console.log("Seed terminé :", { site: site.nom, profilParDefaut: profilParDefaut.nom });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
