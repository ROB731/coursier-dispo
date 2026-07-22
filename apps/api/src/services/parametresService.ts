import { prisma } from "../lib/prisma";
import { ConflictError } from "../lib/errors";

export async function getParametres() {
  const parametres = await prisma.parametresApplication.findFirst();
  if (!parametres) throw new ConflictError("Paramètres non initialisés — exécutez le seed");
  return parametres;
}

export async function modifierParametres(input: {
  modeMultiSite?: boolean;
  fenetreAnnulationBorneMinutes?: number;
  intervallePollingSecondes?: number;
  clotureAutoActive?: boolean;
}) {
  const parametres = await getParametres();
  return prisma.parametresApplication.update({ where: { id: parametres.id }, data: input });
}
