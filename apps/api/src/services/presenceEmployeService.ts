import { StatutPresence, TypeAbsence } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

function debutJournee(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export interface MarquerPresenceInput {
  employeId: string;
  date: Date;
  statut: StatutPresence;
  typeAbsence?: TypeAbsence;
  commentaire?: string;
}

/** Un pointage par employé et par jour — appeler à nouveau pour le même jour met simplement à jour la ligne existante. */
export async function marquerPresence(
  input: MarquerPresenceInput,
  auteur: { id: string; nomComplet: string },
  entreprisesAccessibles: string[] | null
) {
  if (input.statut === "ABSENT" && !input.typeAbsence) {
    throw new ValidationError("Précisez le type d'absence");
  }

  const employe = await prisma.employe.findUnique({ where: { id: input.employeId } });
  if (!employe) throw new NotFoundError("Employé introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, employe.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cet employé");
  }

  const date = debutJournee(input.date);
  const typeAbsence = input.statut === "PRESENT" ? null : input.typeAbsence;

  return prisma.presenceEmploye.upsert({
    where: { employeId_date: { employeId: input.employeId, date } },
    create: {
      employeId: input.employeId,
      date,
      statut: input.statut,
      typeAbsence,
      commentaire: input.commentaire,
      enregistreParId: auteur.id,
      enregistreParNom: auteur.nomComplet,
    },
    update: {
      statut: input.statut,
      typeAbsence,
      commentaire: input.commentaire,
      enregistreParId: auteur.id,
      enregistreParNom: auteur.nomComplet,
    },
  });
}

export interface FiltresRegistre {
  entrepriseId?: string;
  siteId?: string;
  employeId?: string;
  date?: Date;
  depuis?: Date;
  jusqua?: Date;
}

export async function getRegistrePresence(filtres: FiltresRegistre, entreprisesAccessibles: string[] | null) {
  const idsAutorises =
    filtres.entrepriseId && entrepriseAccessible(entreprisesAccessibles, filtres.entrepriseId)
      ? [filtres.entrepriseId]
      : entreprisesAccessibles;

  return prisma.presenceEmploye.findMany({
    where: {
      employeId: filtres.employeId,
      date: filtres.date
        ? debutJournee(filtres.date)
        : { gte: filtres.depuis ? debutJournee(filtres.depuis) : undefined, lte: filtres.jusqua ? debutJournee(filtres.jusqua) : undefined },
      employe: {
        ...(filtres.siteId ? { siteId: filtres.siteId } : {}),
        ...(idsAutorises === null ? {} : { entrepriseId: { in: idsAutorises } }),
      },
    },
    include: { employe: { include: { site: true } } },
    orderBy: [{ date: "desc" }, { employe: { nom: "asc" } }],
    take: 500,
  });
}

// ---------- Pointage à la porte (accès public borne, comme pour les coursiers) ----------

/** Employés actifs d'un site + leur pointage du jour, pour l'écran de la borne. */
export async function listerEmployesBorne(siteId: string) {
  const aujourdHui = debutJournee(new Date());
  const employes = await prisma.employe.findMany({
    where: { actif: true, siteId },
    include: { presences: { where: { date: aujourdHui } } },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return employes.map((e) => ({
    id: e.id,
    prenom: e.prenom,
    nom: e.nom,
    poste: e.poste,
    photoUrl: e.photoUrl,
    presence: e.presences[0] ?? null,
  }));
}

/**
 * Pointage simple à la porte : un aller-retour par jour. Entrée = arrivé,
 * marqué présent. Sortie = reparti (heure notée), mais il reste "présent"
 * pour la journée — contrairement au coursier, dont la sortie bascule l'état
 * temps réel car il peut ressortir/rentrer plusieurs fois pour des courses.
 */
export async function pointerEmployeBorne(employeId: string, siteId: string, type: "ENTREE" | "SORTIE") {
  const employe = await prisma.employe.findUnique({ where: { id: employeId } });
  if (!employe || !employe.actif) throw new NotFoundError("Employé introuvable ou désactivé");
  if (employe.siteId !== siteId) throw new ForbiddenError("Cet employé n'est pas rattaché à ce point");

  const date = debutJournee(new Date());
  const maintenant = new Date();

  if (type === "ENTREE") {
    return prisma.presenceEmploye.upsert({
      where: { employeId_date: { employeId, date } },
      create: { employeId, date, statut: "PRESENT", heureEntree: maintenant },
      update: { statut: "PRESENT", typeAbsence: null, heureEntree: maintenant },
    });
  }

  const existant = await prisma.presenceEmploye.findUnique({ where: { employeId_date: { employeId, date } } });
  if (!existant || existant.statut !== "PRESENT") {
    throw new ValidationError("Aucune entrée enregistrée aujourd'hui pour cet employé");
  }
  return prisma.presenceEmploye.update({ where: { id: existant.id }, data: { heureSortie: maintenant } });
}

/** Le registre du jour pour un site : un employé sans pointage ce jour-là apparaît quand même, statut "null" (non renseigné). */
export async function getRegistreDuJour(
  date: Date,
  filtres: { entrepriseId?: string; siteId?: string },
  entreprisesAccessibles: string[] | null
) {
  const idsAutorises =
    filtres.entrepriseId && entrepriseAccessible(entreprisesAccessibles, filtres.entrepriseId)
      ? [filtres.entrepriseId]
      : entreprisesAccessibles;

  const employes = await prisma.employe.findMany({
    where: {
      actif: true,
      ...(filtres.siteId ? { siteId: filtres.siteId } : {}),
      ...(idsAutorises === null ? {} : { entrepriseId: { in: idsAutorises } }),
    },
    include: {
      site: true,
      presences: { where: { date: debutJournee(date) } },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return employes.map((employe) => ({
    employe: {
      id: employe.id,
      prenom: employe.prenom,
      nom: employe.nom,
      poste: employe.poste,
      photoUrl: employe.photoUrl,
      site: employe.site,
    },
    presence: employe.presences[0] ?? null,
  }));
}
