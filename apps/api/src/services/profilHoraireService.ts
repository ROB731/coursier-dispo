import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";
import { Horaires } from "../lib/horaires";

export interface CreerProfilHoraireInput {
  nom: string;
  horaires: Horaires;
  estParDefaut?: boolean;
  entrepriseId: string;
}

export async function creerProfilHoraire(input: CreerProfilHoraireInput, entreprisesAccessibles: string[] | null) {
  if (!entrepriseAccessible(entreprisesAccessibles, input.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cette entreprise");
  }
  if (input.estParDefaut) {
    await prisma.profilHoraire.updateMany({
      where: { estParDefaut: true, entrepriseId: input.entrepriseId },
      data: { estParDefaut: false },
    });
  }
  return prisma.profilHoraire.create({ data: { ...input, horaires: input.horaires as Prisma.InputJsonValue } });
}

export async function modifierProfilHoraire(
  id: string,
  input: Partial<Omit<CreerProfilHoraireInput, "entrepriseId">> & { actif?: boolean },
  entreprisesAccessibles: string[] | null
) {
  const profil = await prisma.profilHoraire.findUnique({ where: { id } });
  if (!profil) throw new NotFoundError("Profil horaire introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, profil.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce profil horaire");
  }

  if (input.estParDefaut) {
    await prisma.profilHoraire.updateMany({
      where: { estParDefaut: true, entrepriseId: profil.entrepriseId },
      data: { estParDefaut: false },
    });
  }

  return prisma.profilHoraire.update({
    where: { id },
    data: { ...input, horaires: input.horaires as Prisma.InputJsonValue | undefined },
  });
}

export async function listerProfilsHoraires(entreprisesAccessibles: string[] | null, entrepriseId?: string) {
  const idsAutorises =
    entrepriseId && entrepriseAccessible(entreprisesAccessibles, entrepriseId) ? [entrepriseId] : entreprisesAccessibles;

  return prisma.profilHoraire.findMany({
    where: {
      actif: true,
      ...(idsAutorises === null ? {} : { entrepriseId: { in: idsAutorises } }),
    },
    orderBy: { nom: "asc" },
  });
}
