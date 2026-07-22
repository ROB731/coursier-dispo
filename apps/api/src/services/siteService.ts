import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

export interface CreerSiteInput {
  nom: string;
  adresse?: string;
  ville?: string;
}

export async function creerSite(input: CreerSiteInput) {
  return prisma.site.create({ data: input });
}

export async function modifierSite(id: string, input: Partial<CreerSiteInput> & { actif?: boolean }) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) throw new NotFoundError("Site introuvable");
  return prisma.site.update({ where: { id }, data: input });
}

export async function listerSites() {
  return prisma.site.findMany({ orderBy: { nom: "asc" } });
}

export async function getSiteParId(id: string) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) throw new NotFoundError("Site introuvable");
  return site;
}
