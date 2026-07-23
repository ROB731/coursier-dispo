import { Prisma, TypeContrat } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

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

async function verifierAccesCoursier(coursierId: string, entreprisesAccessibles: string[] | null) {
  if (entreprisesAccessibles === null) return;
  const rattachement = await prisma.coursierSite.findFirst({
    where: { coursierId, actif: true, site: { entrepriseId: { in: entreprisesAccessibles } } },
  });
  if (!rattachement) throw new ForbiddenError("Vous ne gérez pas ce coursier");
}

export async function creerCoursier(input: CreerCoursierInput, entreprisesAccessibles: string[] | null) {
  const site = await prisma.site.findUnique({ where: { id: input.siteId } });
  if (!site) throw new NotFoundError("Site introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce site");
  }

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

export async function modifierCoursier(id: string, input: ModifierCoursierInput, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);

  if (input.code && input.code !== coursier.code) {
    const codeExistant = await prisma.coursier.findUnique({ where: { code: input.code } });
    if (codeExistant) throw new ConflictError(`Le code "${input.code}" est déjà utilisé`);
  }

  return prisma.coursier.update({ where: { id }, data: input });
}

export async function desactiverCoursier(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);
  return prisma.coursier.update({ where: { id }, data: { statutActif: false } });
}

export async function reactiverCoursier(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);
  return prisma.coursier.update({ where: { id }, data: { statutActif: true } });
}

export async function listerCoursiers(
  filtres: { siteId?: string; actifSeulement?: boolean; entrepriseId?: string } = {},
  entreprisesAccessibles: string[] | null = null
) {
  const where: Prisma.CoursierWhereInput = {};
  if (filtres.actifSeulement) where.statutActif = true;

  const idsAutorises =
    filtres.entrepriseId && entrepriseAccessible(entreprisesAccessibles, filtres.entrepriseId)
      ? [filtres.entrepriseId]
      : entreprisesAccessibles;

  if (filtres.siteId) {
    where.coursierSites = { some: { siteId: filtres.siteId, actif: true } };
  } else if (idsAutorises !== null) {
    where.coursierSites = { some: { actif: true, site: { entrepriseId: { in: idsAutorises } } } };
  }

  return prisma.coursier.findMany({
    where,
    include: { profilHoraire: true, coursierSites: { include: { site: true } } },
    orderBy: { code: "asc" },
  });
}

export async function getCoursierParId(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({
    where: { id },
    include: { profilHoraire: true, coursierSites: { include: { site: true } } },
  });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);
  return coursier;
}
