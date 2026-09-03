import { EtatJournee } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError } from "../lib/errors";

function dateDuJour(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function obtenirJourneeSite(siteId: string, maintenant = new Date()) {
  return prisma.journeeSite.findUnique({ where: { siteId_date: { siteId, date: dateDuJour(maintenant) } } });
}

export async function demarrerJournee(siteId: string, terminalId: string) {
  const maintenant = new Date();
  const date = dateDuJour(maintenant);
  const coursiers = await prisma.coursierSite.findMany({
    where: { siteId, actif: true, coursier: { statutActif: true } },
    select: { coursierId: true },
  });
  const existante = await obtenirJourneeSite(siteId, maintenant);
  if (existante) throw new ConflictError(existante.etat === EtatJournee.OUVERTE ? "La journée est déjà démarrée" : "La journée est déjà fermée");

  return prisma.$transaction(async (transaction) => {
    const journee = await transaction.journeeSite.create({
      data: { siteId, date, etat: EtatJournee.OUVERTE, demarreeLe: maintenant, terminalId },
    });
    if (coursiers.length > 0) {
      await transaction.evenement.createMany({
        data: coursiers.map(({ coursierId }) => ({
          coursierId,
          siteId,
          type: "SORTIE" as const,
          source: "BORNE" as const,
          terminalId,
          horodatage: maintenant,
        })),
      });
    }
    return journee;
  });
}

export async function fermerJournee(siteId: string, terminalId: string) {
  const maintenant = new Date();
  const journee = await obtenirJourneeSite(siteId, maintenant);
  if (!journee) throw new ConflictError("La journée n'est pas démarrée");
  if (journee.etat === EtatJournee.FERMEE) throw new ConflictError("La journée est déjà fermée");

  const coursiers = await prisma.coursierSite.findMany({
    where: { siteId, actif: true, coursier: { statutActif: true } },
    select: { coursierId: true },
  });
  return prisma.$transaction(async (transaction) => {
    const miseAJour = await transaction.journeeSite.update({
      where: { id: journee.id },
      data: { etat: EtatJournee.FERMEE, fermeeLe: maintenant, terminalId },
    });
    if (coursiers.length > 0) {
      await transaction.evenement.createMany({
        data: coursiers.map(({ coursierId }) => ({
          coursierId,
          siteId,
          type: "ENTREE" as const,
          source: "BORNE" as const,
          terminalId,
          horodatage: maintenant,
        })),
      });
    }
    return miseAJour;
  });
}

