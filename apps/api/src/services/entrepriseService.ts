import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

export interface CreerEntrepriseInput {
  nom: string;
}

export async function creerEntreprise(input: CreerEntrepriseInput) {
  const entreprise = await prisma.entreprise.create({ data: input });
  // Paramètres par défaut créés immédiatement pour que l'entreprise soit utilisable sans étape supplémentaire.
  await prisma.parametresApplication.create({ data: { entrepriseId: entreprise.id } });
  return entreprise;
}

export async function modifierEntreprise(id: string, input: Partial<CreerEntrepriseInput> & { actif?: boolean }) {
  const entreprise = await prisma.entreprise.findUnique({ where: { id } });
  if (!entreprise) throw new NotFoundError("Entreprise introuvable");
  return prisma.entreprise.update({ where: { id }, data: input });
}

export async function listerEntreprises(entreprisesAccessibles: string[] | null) {
  return prisma.entreprise.findMany({
    where: entreprisesAccessibles === null ? undefined : { id: { in: entreprisesAccessibles } },
    orderBy: { nom: "asc" },
  });
}

export async function getEntrepriseParId(id: string) {
  const entreprise = await prisma.entreprise.findUnique({ where: { id } });
  if (!entreprise) throw new NotFoundError("Entreprise introuvable");
  return entreprise;
}
