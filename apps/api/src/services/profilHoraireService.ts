import { JourSemaine } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

export interface CreerProfilHoraireInput {
  nom: string;
  heureDebut: string;
  heureFin: string;
  joursApplicables: JourSemaine[];
  estParDefaut?: boolean;
}

export async function creerProfilHoraire(input: CreerProfilHoraireInput) {
  if (input.estParDefaut) {
    await prisma.profilHoraire.updateMany({ where: { estParDefaut: true }, data: { estParDefaut: false } });
  }
  return prisma.profilHoraire.create({ data: input });
}

export async function modifierProfilHoraire(id: string, input: Partial<CreerProfilHoraireInput> & { actif?: boolean }) {
  const profil = await prisma.profilHoraire.findUnique({ where: { id } });
  if (!profil) throw new NotFoundError("Profil horaire introuvable");

  if (input.estParDefaut) {
    await prisma.profilHoraire.updateMany({ where: { estParDefaut: true }, data: { estParDefaut: false } });
  }

  return prisma.profilHoraire.update({ where: { id }, data: input });
}

export async function listerProfilsHoraires() {
  return prisma.profilHoraire.findMany({ where: { actif: true }, orderBy: { nom: "asc" } });
}
