import { Prisma, TypeContrat } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

export const DELAI_ARCHIVAGE_COURSIER_JOURS = 30;

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr-FR");
}

function normaliserCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toLocaleUpperCase("fr-FR");
}

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

async function verifierAccesCoursier(
  coursierId: string,
  entreprisesAccessibles: string[] | null,
  inclureRattachementsDesactives = false
) {
  if (entreprisesAccessibles === null) return;
  const rattachement = await prisma.coursierSite.findFirst({
    where: {
      coursierId,
      actif: inclureRattachementsDesactives ? undefined : true,
      site: { entrepriseId: { in: entreprisesAccessibles } },
    },
  });
  if (!rattachement) throw new ForbiddenError("Vous ne gérez pas ce coursier");
}

async function verifierDoublonIdentite(
  prenom: string,
  nom: string,
  entrepriseId: string,
  coursierIdExclu?: string
) {
  const prenomNormalise = normaliserTexte(prenom);
  const nomNormalise = normaliserTexte(nom);
  const candidats = await prisma.coursier.findMany({
    where: {
      id: coursierIdExclu ? { not: coursierIdExclu } : undefined,
      coursierSites: { some: { site: { entrepriseId } } },
    },
    select: { id: true, code: true, prenom: true, nom: true, statutActif: true },
  });
  const doublon = candidats.find(
    (c) => normaliserTexte(c.prenom) === prenomNormalise && normaliserTexte(c.nom) === nomNormalise
  );
  if (doublon) {
    throw new ConflictError(
      `Un coursier porte déjà le nom « ${doublon.prenom} ${doublon.nom} » (code ${doublon.code}${doublon.statutActif ? "" : ", désactivé"}).`
    );
  }
}

export async function creerCoursier(input: CreerCoursierInput, entreprisesAccessibles: string[] | null) {
  const site = await prisma.site.findUnique({ where: { id: input.siteId } });
  if (!site) throw new NotFoundError("Site introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce site");
  }

  const code = normaliserCode(input.code);
  const codeExistant = await prisma.coursier.findFirst({ where: { code: { equals: code, mode: "insensitive" } } });
  if (codeExistant) throw new ConflictError(`Le code "${code}" est déjà utilisé, même si le coursier est désactivé.`);
  await verifierDoublonIdentite(input.prenom, input.nom, site.entrepriseId);

  const { siteId, ...coursierData } = input;

  return prisma.coursier.create({
    data: {
      ...coursierData,
      code,
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
  if (coursier.archiveLe) throw new ConflictError("Ce coursier est archivé définitivement et ne peut plus être modifié.");

  if (input.code) {
    const code = normaliserCode(input.code);
    if (code === coursier.code) {
      input = { ...input, code };
    } else {
      const codeExistant = await prisma.coursier.findFirst({ where: { code: { equals: code, mode: "insensitive" } } });
      if (codeExistant) throw new ConflictError(`Le code "${code}" est déjà utilisé, même si le coursier est désactivé.`);
      input = { ...input, code };
    }
  }

  if (input.prenom !== undefined || input.nom !== undefined) {
    const prenom = input.prenom ?? coursier.prenom;
    const nom = input.nom ?? coursier.nom;
    const rattachement = await prisma.coursierSite.findFirst({
      where: {
        coursierId: id,
        site: entreprisesAccessibles === null ? undefined : { entrepriseId: { in: entreprisesAccessibles } },
      },
      include: { site: true },
    });
    const entrepriseId = rattachement?.site.entrepriseId;
    if (entrepriseId) await verifierDoublonIdentite(prenom, nom, entrepriseId, id);
  }

  return prisma.coursier.update({ where: { id }, data: input });
}

export async function desactiverCoursier(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);
  return prisma.coursier.update({ where: { id }, data: { statutActif: false, desactiveLe: new Date(), archiveLe: null } });
}

export async function reactiverCoursier(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles);
  if (coursier.archiveLe) throw new ConflictError("Ce coursier est archivé définitivement et ne peut plus être réactivé.");
  return prisma.coursier.update({ where: { id }, data: { statutActif: true } });
}

export async function supprimerCoursier(id: string, entreprisesAccessibles: string[] | null) {
  const coursier = await prisma.coursier.findUnique({ where: { id } });
  if (!coursier) throw new NotFoundError("Coursier introuvable");
  await verifierAccesCoursier(id, entreprisesAccessibles, true);

  if (coursier.statutActif) {
    throw new ConflictError("Désactivez d'abord le coursier avant de le supprimer.");
  }

  if (coursier.desactiveLe) {
    const delai = DELAI_ARCHIVAGE_COURSIER_JOURS * 24 * 60 * 60 * 1000;
    if (Date.now() - coursier.desactiveLe.getTime() < delai) {
      throw new ConflictError(`Ce coursier pourra être archivé après ${DELAI_ARCHIVAGE_COURSIER_JOURS} jours de désactivation.`);
    }
  }

  const nombreEvenements = await prisma.evenement.count({ where: { coursierId: id } });
  if (nombreEvenements === 0) {
    await prisma.coursier.delete({ where: { id } });
    return { id };
  }

  await prisma.coursier.update({
    where: { id },
    data: {
      statutActif: false,
      archiveLe: new Date(),
      code: `ARCHIVE-${id.slice(0, 8)}`,
      photoUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
      prenom: "Coursier",
      nom: "Archivé",
      telephone: null,
      email: null,
      dateNaissance: null,
      adresse: null,
      typeContrat: null,
      dateEmbauche: null,
      contactUrgenceNom: null,
      contactUrgenceTelephone: null,
      notes: null,
    },
  });
  return { id };
}

export async function listerCoursiers(
  filtres: { siteId?: string; actifSeulement?: boolean; entrepriseId?: string } = {},
  entreprisesAccessibles: string[] | null = null
) {
  const where: Prisma.CoursierWhereInput = { archiveLe: null };
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
