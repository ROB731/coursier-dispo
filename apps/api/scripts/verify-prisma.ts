import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const site = await prisma.site.findFirst();
  const nbUtilisateurs = await prisma.utilisateur.count();
  if (!site) throw new Error("Aucun site trouvé — le seed a-t-il été exécuté ?");
  console.log(`✅ Connected — site "${site.nom}", ${nbUtilisateurs} compte(s) utilisateur`);
}

main()
  .catch((err) => {
    console.error("❌ Échec de la connexion :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
