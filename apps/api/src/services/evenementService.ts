import { SourceEvenement, TypeEvenement } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { creerNotificationCoursierArrive, creerNotificationAucunDisponible } from "./notificationService";
import { getStatutsSite } from "./statutService";

async function getParametres() {
  const parametres = await prisma.parametresApplication.findFirst();
  if (!parametres) throw new ConflictError("Paramètres de l'application non initialisés — exécutez le seed");
  return parametres;
}

interface CreerEvenementBorneParams {
  coursierId: string;
  type: Extract<TypeEvenement, "ENTREE" | "SORTIE">;
  terminalId: string;
}

export async function creerEvenementBorne({ coursierId, type, terminalId }: CreerEvenementBorneParams) {
  const terminal = await prisma.terminal.findUnique({ where: { id: terminalId } });
  if (!terminal || !terminal.actif) throw new NotFoundError("Borne inconnue ou désactivée");

  const rattachement = await prisma.coursierSite.findFirst({
    where: { coursierId, siteId: terminal.siteId, actif: true },
  });
  if (!rattachement) throw new ValidationError("Ce coursier n'est pas rattaché au site de cette borne");

  const evenement = await prisma.evenement.create({
    data: {
      coursierId,
      siteId: terminal.siteId,
      type,
      source: "BORNE",
      terminalId,
      horodatage: new Date(),
    },
  });

  await prisma.terminal.update({ where: { id: terminalId }, data: { derniereActiviteAt: new Date() } });

  if (type === "ENTREE") {
    await creerNotificationCoursierArrive(coursierId, terminal.siteId);
  } else {
    const statuts = await getStatutsSite(terminal.siteId);
    const aucunDisponible = statuts.every((s) => s.statut !== "DISPONIBLE");
    if (aucunDisponible) await creerNotificationAucunDisponible(terminal.siteId);
  }

  return evenement;
}

interface AnnulerEvenementParams {
  evenementId: string;
  source: SourceEvenement;
  terminalId?: string;
  utilisateurId?: string;
}

export async function annulerEvenement({ evenementId, source, terminalId, utilisateurId }: AnnulerEvenementParams) {
  const original = await prisma.evenement.findUnique({ where: { id: evenementId }, include: { annulePar: true } });
  if (!original) throw new NotFoundError("Événement introuvable");
  if (original.type === "ANNULATION") throw new ValidationError("Un événement d'annulation ne peut pas être annulé");
  if (original.annulePar) throw new ConflictError("Cet événement a déjà été annulé");

  if (source === "BORNE") {
    const parametres = await getParametres();
    const minutesEcoulees = (Date.now() - original.horodatage.getTime()) / 60000;
    if (minutesEcoulees > parametres.fenetreAnnulationBorneMinutes) {
      throw new ForbiddenError(
        `Fenêtre de correction dépassée (${parametres.fenetreAnnulationBorneMinutes} min) — contactez la Gérante`
      );
    }
    if (terminalId) {
      const terminal = await prisma.terminal.findUnique({ where: { id: terminalId } });
      if (!terminal || terminal.siteId !== original.siteId) {
        throw new ValidationError("Cette borne ne peut pas annuler un événement d'un autre site");
      }
    }
  }

  return prisma.evenement.create({
    data: {
      coursierId: original.coursierId,
      siteId: original.siteId,
      type: "ANNULATION",
      evenementAnnuleId: original.id,
      source,
      terminalId: source === "BORNE" ? terminalId : undefined,
      creeParUtilisateurId: source === "COMPTE" ? utilisateurId : undefined,
      horodatage: new Date(),
    },
  });
}

interface HistoriqueFiltres {
  coursierId?: string;
  siteId?: string;
  depuis?: Date;
  jusqua?: Date;
}

export async function getHistorique(filtres: HistoriqueFiltres) {
  return prisma.evenement.findMany({
    where: {
      coursierId: filtres.coursierId,
      siteId: filtres.siteId,
      horodatage: {
        gte: filtres.depuis,
        lte: filtres.jusqua,
      },
    },
    include: { coursier: true, site: true, terminal: true, creeParUtilisateur: true, evenementAnnule: true },
    orderBy: { horodatage: "desc" },
    take: 500,
  });
}
