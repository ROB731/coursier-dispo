import { Prisma, TypeContrat } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError } from "../lib/errors";

export interface CreerCoursierInput {
  code: string;
  photoUrl: string;
  prenom: string;
  nom: string;
  telephone?: string;
  email?: string;
  dateNaissance?: Date;
  adresse?: string;
  typeContrat?: TypeContrat;
  dateEmbauche?: Date;
  contactUrgenceNom?: string;
  contactUrgenceTelephone?: string;
  profilHoraireId: string;
  notes?: string;
  siteId: string;
}

export async function creerCoursier(input: CreerCoursierInput) {
  const codeExistant = await prisma.coursier.findUnique({ where: { code: input.code } });
  if (codeExistant) throw new ConflictError(`Le code "${input.code}" est déjà utilisé`);

  const { siteId, ...coursierData } = input;

  return prisma.coursier.create({
    data: {
      ...coursierData,
      coursierSites: {
        create: { siteId, estSitePrincipal: true },
      },
    },
    include: { coursierSites: true, profilHoraire: true },
  });
}

export type ModifierCoursierInput = Partial<Omit<CreerCoursierInput, "siteId">>;

export async function modifierCoursier(id: string, input: ModifierCoursierInput) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");

  if (input.code && input.code !== coursier.code) {
    const codeExistant = await prisma.coursier.findUnique({ where: { code: input.code } });
    if (codeExistant) throw new ConflictError(`Le code "${input.code}" est déjà utilisé`);
  }

  return prisma.coursier.update({ where: { id }, data: input });
}

export async function desactiverCoursier(id: string) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  return prisma.coursier.update({ where: { id }, data: { statutActif: false } });
}

export async function reactiverCoursier(id: string) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  return prisma.coursier.update({ where: { id }, data: { statutActif: true } });
}

export async function listerCoursiers(filtres: { siteId?: string; actifSeulement?: boolean } = {}) {
  const where: Prisma.CoursierWhereInput = {};
  if (filtres.actifSeulement) where.statutActif = true;
  if (filtres.siteId) where.coursierSites = { some: { siteId: filtres.siteId, actif: true } };

  return prisma.coursier.findMany({
    where,
    include: { profilHoraire: true, coursierSites: { include: { site: true } } },
    orderBy: { code: "asc" },
  });
}

export async function getCoursierParId(id: string) {
  const coursier = await prisma.coursier.findUnique({
    where: { id },
    include: { profilHoraire: true, coursierSites: { include: { site: true } } },
  });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  return coursier;
}
