import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

export interface CreerSiteInput {
  nom: string;
  adresse?: string;
  ville?: string;
  entrepriseId: string;
}

export async function creerSite(input: CreerSiteInput, entreprisesAccessibles: string[] | null) {
  if (!entrepriseAccessible(entreprisesAccessibles, input.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cette entreprise");
  }
  const [parametres, sitesExistants] = await Promise.all([
    prisma.parametresApplication.findUnique({ where: { entrepriseId: input.entrepriseId } }),
    prisma.site.count({ where: { entrepriseId: input.entrepriseId, actif: true } }),
  ]);
  if (!parametres?.modeMultiSite && sitesExistants >= 1) {
    throw new ForbiddenError(
      "Cette entreprise n'a pas l'autorisation multi-site (accordée par le Super Administrateur) : un seul site est autorisé"
    );
  }
  return prisma.site.create({ data: input });
}

export async function modifierSite(
  id: string,
  input: Partial<Omit<CreerSiteInput, "entrepriseId">> & { actif?: boolean },
  entreprisesAccessibles: string[] | null
) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) throw new NotFoundError("Site introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce site");
  }
  return prisma.site.update({ where: { id }, data: input });
}

export async function listerSites(entreprisesAccessibles: string[] | null, entrepriseId?: string) {
  const idsAutorises =
    entrepriseId && entrepriseAccessible(entreprisesAccessibles, entrepriseId) ? [entrepriseId] : entreprisesAccessibles;

  return prisma.site.findMany({
    where: idsAutorises === null ? undefined : { entrepriseId: { in: idsAutorises } },
    orderBy: { nom: "asc" },
  });
}

export async function getSiteParId(id: string, entreprisesAccessibles: string[] | null) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) throw new NotFoundError("Site introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce site");
  }
  return site;
}
