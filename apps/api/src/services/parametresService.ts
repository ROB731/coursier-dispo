import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

export async function getParametres(entrepriseId: string, entreprisesAccessibles: string[] | null) {
  if (!entrepriseAccessible(entreprisesAccessibles, entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cette entreprise");
  }
  const parametres = await prisma.parametresApplication.findUnique({ where: { entrepriseId } });
  if (!parametres) throw new NotFoundError("Paramètres non initialisés pour cette entreprise");
  return parametres;
}

export async function modifierParametres(
  entrepriseId: string,
  input: {
    modeMultiSite?: boolean;
    fenetreAnnulationBorneMinutes?: number;
    intervallePollingSecondes?: number;
    clotureAutoActive?: boolean;
  },
  entreprisesAccessibles: string[] | null,
  roleAppelant: "SUPER_ADMIN" | "DIRECTEUR" | "GERANTE"
) {
  const parametres = await getParametres(entrepriseId, entreprisesAccessibles);
  const { modeMultiSite, ...reste } = input;
  if (modeMultiSite !== undefined && roleAppelant !== "SUPER_ADMIN") {
    throw new ForbiddenError("Seul le Super Administrateur peut accorder ou retirer le mode multi-site");
  }
  const donnees = roleAppelant === "SUPER_ADMIN" ? input : reste;
  return prisma.parametresApplication.update({ where: { id: parametres.id }, data: donnees });
}
