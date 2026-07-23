import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const entreprise = await prisma.entreprise.upsert({
    where: { id: "00000000-0000-0000-0000-000000000099" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000099",
      nom: "IVOIRRAPID",
    },
  });

  const sites = await prisma.site.updateMany({
    where: { entrepriseId: null },
    data: { entrepriseId: entreprise.id },
  });

  const profils = await prisma.profilHoraire.updateMany({
    where: { entrepriseId: null },
    data: { entrepriseId: entreprise.id },
  });

  const parametresExistants = await prisma.parametresApplication.findFirst({ where: { entrepriseId: null } });
  if (parametresExistants) {
    await prisma.parametresApplication.update({
      where: { id: parametresExistants.id },
      data: { entrepriseId: entreprise.id },
    });
  }

  console.log("Backfill terminé :", {
    entreprise: entreprise.nom,
    sitesMisAJour: sites.count,
    profilsMisAJour: profils.count,
    parametresMisAJour: parametresExistants ? 1 : 0,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
