import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

export interface CreerEmployeInput {
  entrepriseId: string;
  siteId?: string;
  prenom: string;
  nom: string;
  poste?: string;
  telephone?: string;
  email?: string;
  photoUrl?: string;
}

export type ModifierEmployeInput = Partial<Omit<CreerEmployeInput, "entrepriseId">>;

async function verifierAccesEmploye(employeId: string, entreprisesAccessibles: string[] | null) {
  if (entreprisesAccessibles === null) return;
  const employe = await prisma.employe.findUnique({ where: { id: employeId } });
  if (!employe) throw new NotFoundError("Employé introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, employe.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cet employé");
  }
}

export async function creerEmploye(input: CreerEmployeInput, entreprisesAccessibles: string[] | null) {
  if (!entrepriseAccessible(entreprisesAccessibles, input.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cette entreprise");
  }
  if (input.siteId) {
    const site = await prisma.site.findUnique({ where: { id: input.siteId } });
    if (!site || site.entrepriseId !== input.entrepriseId) {
      throw new NotFoundError("Site introuvable pour cette entreprise");
    }
  }
  return prisma.employe.create({ data: input, include: { site: true } });
}

export async function modifierEmploye(id: string, input: ModifierEmployeInput, entreprisesAccessibles: string[] | null) {
  const employe = await prisma.employe.findUnique({ where: { id } });
  if (!employe) throw new NotFoundError("Employé introuvable");
  await verifierAccesEmploye(id, entreprisesAccessibles);

  if (input.siteId) {
    const site = await prisma.site.findUnique({ where: { id: input.siteId } });
    if (!site || site.entrepriseId !== employe.entrepriseId) {
      throw new NotFoundError("Site introuvable pour cette entreprise");
    }
  }

  return prisma.employe.update({ where: { id }, data: input, include: { site: true } });
}

export async function desactiverEmploye(id: string, entreprisesAccessibles: string[] | null) {
  await verifierAccesEmploye(id, entreprisesAccessibles);
  return prisma.employe.update({ where: { id }, data: { actif: false } });
}

export async function reactiverEmploye(id: string, entreprisesAccessibles: string[] | null) {
  await verifierAccesEmploye(id, entreprisesAccessibles);
  return prisma.employe.update({ where: { id }, data: { actif: true } });
}

export async function listerEmployes(
  entreprisesAccessibles: string[] | null,
  filtres: { entrepriseId?: string; siteId?: string; actifSeulement?: boolean } = {}
) {
  const idsAutorises =
    filtres.entrepriseId && entrepriseAccessible(entreprisesAccessibles, filtres.entrepriseId)
      ? [filtres.entrepriseId]
      : entreprisesAccessibles;

  return prisma.employe.findMany({
    where: {
      ...(filtres.actifSeulement ? { actif: true } : {}),
      ...(filtres.siteId ? { siteId: filtres.siteId } : {}),
      ...(idsAutorises === null ? {} : { entrepriseId: { in: idsAutorises } }),
    },
    include: { site: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

export async function getEmployeParId(id: string, entreprisesAccessibles: string[] | null) {
  const employe = await prisma.employe.findUnique({ where: { id }, include: { site: true } });
  if (!employe) throw new NotFoundError("Employé introuvable");
  await verifierAccesEmploye(id, entreprisesAccessibles);
  return employe;
}
