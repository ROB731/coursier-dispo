import { RoleUtilisateur } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { hashPassword } from "./authService";
import { entrepriseAccessible } from "./perimetreService";

export interface CreerUtilisateurInput {
  identifiant: string;
  motDePasse: string;
  role: RoleUtilisateur;
  nomComplet: string;
  telephone?: string;
  email?: string;
  siteParDefautId?: string;
  // DIRECTEUR : entreprises supervisées.
  entrepriseIds?: string[];
  // GERANTE : rattachement direct (alternative à directeurId).
  entrepriseId?: string;
  // GERANTE : rattachement via un directeur (hérite de son périmètre).
  directeurId?: string;
}

const SELECT_UTILISATEUR = {
  id: true,
  identifiant: true,
  nomComplet: true,
  role: true,
  telephone: true,
  email: true,
  siteParDefautId: true,
  entrepriseId: true,
  entreprise: { select: { nom: true } },
  directeurId: true,
  directeur: { select: { nomComplet: true } },
  actif: true,
  derniereConnexionAt: true,
  createdAt: true,
  directeurEntreprises: { select: { entrepriseId: true, entreprise: { select: { nom: true } } } },
} as const;

/** Vérifie que le rattachement demandé est cohérent avec le rôle et dans le périmètre du créateur. */
async function validerRattachement(
  input: Pick<CreerUtilisateurInput, "role" | "entrepriseIds" | "entrepriseId" | "directeurId">,
  entreprisesAccessibles: string[] | null
) {
  if (input.role === "SUPER_ADMIN") return;

  if (input.role === "DIRECTEUR") {
    if (!input.entrepriseIds || input.entrepriseIds.length === 0) {
      throw new ValidationError("Un directeur doit être rattaché à au moins une entreprise");
    }
    for (const id of input.entrepriseIds) {
      if (!entrepriseAccessible(entreprisesAccessibles, id)) {
        throw new ForbiddenError("Vous ne gérez pas une des entreprises sélectionnées");
      }
    }
    return;
  }

  // GERANTE
  if (!input.entrepriseId && !input.directeurId) {
    throw new ValidationError("Un gérant doit être rattaché à une entreprise ou à un directeur");
  }
  if (input.entrepriseId) {
    if (!entrepriseAccessible(entreprisesAccessibles, input.entrepriseId)) {
      throw new ForbiddenError("Vous ne gérez pas cette entreprise");
    }
  }
  if (input.directeurId) {
    const directeur = await prisma.utilisateur.findUnique({
      where: { id: input.directeurId },
      include: { directeurEntreprises: true },
    });
    if (!directeur || directeur.role !== "DIRECTEUR") throw new ValidationError("Directeur sélectionné invalide");
    const accessible = directeur.directeurEntreprises.some((d) => entrepriseAccessible(entreprisesAccessibles, d.entrepriseId));
    if (!accessible) throw new ForbiddenError("Vous ne gérez pas ce directeur");
  }
}

/** Un DIRECTEUR ne peut créer/gérer que des comptes GERANTE. */
function verifierRoleAutorise(roleCreateur: RoleUtilisateur, roleCible: RoleUtilisateur) {
  if (roleCreateur === "DIRECTEUR" && roleCible !== "GERANTE") {
    throw new ForbiddenError("Un directeur ne peut créer que des comptes Gérant(e)");
  }
}

/**
 * Vérifie qu'un DIRECTEUR a le droit d'agir sur un compte cible (modification,
 * réinitialisation de mot de passe, désactivation) : jamais sur un compte
 * SUPER_ADMIN ou DIRECTEUR, et uniquement sur un GERANTE dont le périmètre
 * effectif (entreprise directe ou via son directeur) recoupe le sien.
 * Un SUPER_ADMIN peut toujours agir.
 */
async function verifierAccesCompteCible(
  cibleId: string,
  roleAppelant: RoleUtilisateur,
  entreprisesAccessibles: string[] | null
) {
  if (roleAppelant === "SUPER_ADMIN") return;

  const cible = await prisma.utilisateur.findUnique({ where: { id: cibleId } });
  if (!cible) throw new NotFoundError("Compte introuvable");
  if (cible.role !== "GERANTE") {
    throw new ForbiddenError("Action non autorisée sur ce compte");
  }

  let entreprisesCible: string[] = [];
  if (cible.entrepriseId) {
    entreprisesCible = [cible.entrepriseId];
  } else if (cible.directeurId) {
    const directeur = await prisma.utilisateur.findUnique({
      where: { id: cible.directeurId },
      include: { directeurEntreprises: true },
    });
    entreprisesCible = directeur?.directeurEntreprises.map((d) => d.entrepriseId) ?? [];
  }

  const accessible = entreprisesCible.some((id) => entrepriseAccessible(entreprisesAccessibles, id));
  if (!accessible) throw new ForbiddenError("Vous ne gérez pas ce compte");
}

export async function creerUtilisateur(
  input: CreerUtilisateurInput,
  roleCreateur: RoleUtilisateur,
  entreprisesAccessibles: string[] | null
) {
  verifierRoleAutorise(roleCreateur, input.role);
  await validerRattachement(input, entreprisesAccessibles);

  const existant = await prisma.utilisateur.findUnique({ where: { identifiant: input.identifiant } });
  if (existant) throw new ConflictError(`L'identifiant "${input.identifiant}" est déjà utilisé`);

  const { motDePasse, entrepriseIds, ...reste } = input;

  return prisma.utilisateur.create({
    data: {
      ...reste,
      motDePasseHash: await hashPassword(motDePasse),
      directeurEntreprises:
        input.role === "DIRECTEUR" && entrepriseIds
          ? { create: entrepriseIds.map((entrepriseId) => ({ entrepriseId })) }
          : undefined,
    },
    select: SELECT_UTILISATEUR,
  });
}

export type ModifierUtilisateurInput = Partial<
  Omit<CreerUtilisateurInput, "identifiant" | "motDePasse" | "role">
>;

export async function modifierUtilisateur(
  id: string,
  input: ModifierUtilisateurInput,
  roleAppelant: RoleUtilisateur,
  entreprisesAccessibles: string[] | null
) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id }, include: { directeurEntreprises: true } });
  if (!utilisateur) throw new NotFoundError("Compte introuvable");

  await verifierAccesCompteCible(id, roleAppelant, entreprisesAccessibles);

  // Ne revalide le rattachement que s'il est effectivement modifié — sinon une
  // simple mise à jour du téléphone échouerait faussement.
  const rattachementModifie =
    input.entrepriseIds !== undefined || input.entrepriseId !== undefined || input.directeurId !== undefined;
  if (rattachementModifie) {
    await validerRattachement(
      {
        role: utilisateur.role,
        entrepriseIds: input.entrepriseIds ?? utilisateur.directeurEntreprises.map((d) => d.entrepriseId),
        entrepriseId: input.entrepriseId ?? utilisateur.entrepriseId ?? undefined,
        directeurId: input.directeurId ?? utilisateur.directeurId ?? undefined,
      },
      entreprisesAccessibles
    );
  }

  const { entrepriseIds, ...reste } = input;

  return prisma.$transaction(async (tx) => {
    if (utilisateur.role === "DIRECTEUR" && entrepriseIds) {
      await tx.directeurEntreprise.deleteMany({ where: { directeurId: id } });
      await tx.directeurEntreprise.createMany({
        data: entrepriseIds.map((entrepriseId) => ({ directeurId: id, entrepriseId })),
      });
    }
    return tx.utilisateur.update({ where: { id }, data: reste, select: SELECT_UTILISATEUR });
  });
}

export async function reinitialiserMotDePasse(
  id: string,
  nouveauMotDePasse: string,
  roleAppelant: RoleUtilisateur,
  entreprisesAccessibles: string[] | null
) {
  await verifierAccesCompteCible(id, roleAppelant, entreprisesAccessibles);
  return prisma.utilisateur.update({
    where: { id },
    data: { motDePasseHash: await hashPassword(nouveauMotDePasse) },
  });
}

export async function desactiverUtilisateur(id: string, roleAppelant: RoleUtilisateur, entreprisesAccessibles: string[] | null) {
  await verifierAccesCompteCible(id, roleAppelant, entreprisesAccessibles);
  return prisma.utilisateur.update({ where: { id }, data: { actif: false } });
}

export async function reactiverUtilisateur(id: string, roleAppelant: RoleUtilisateur, entreprisesAccessibles: string[] | null) {
  await verifierAccesCompteCible(id, roleAppelant, entreprisesAccessibles);
  return prisma.utilisateur.update({ where: { id }, data: { actif: true } });
}

export async function listerUtilisateurs(entreprisesAccessibles: string[] | null) {
  if (entreprisesAccessibles === null) {
    return prisma.utilisateur.findMany({ select: SELECT_UTILISATEUR, orderBy: { nomComplet: "asc" } });
  }

  return prisma.utilisateur.findMany({
    where: {
      OR: [
        { role: "GERANTE", entrepriseId: { in: entreprisesAccessibles } },
        { role: "GERANTE", directeur: { directeurEntreprises: { some: { entrepriseId: { in: entreprisesAccessibles } } } } },
        { role: "DIRECTEUR", directeurEntreprises: { some: { entrepriseId: { in: entreprisesAccessibles } } } },
      ],
    },
    select: SELECT_UTILISATEUR,
    orderBy: { nomComplet: "asc" },
  });
}

export async function listerDirecteursAccessibles(entreprisesAccessibles: string[] | null) {
  return prisma.utilisateur.findMany({
    where: {
      role: "DIRECTEUR",
      actif: true,
      ...(entreprisesAccessibles === null
        ? {}
        : { directeurEntreprises: { some: { entrepriseId: { in: entreprisesAccessibles } } } }),
    },
    select: { id: true, nomComplet: true, directeurEntreprises: { select: { entrepriseId: true } } },
    orderBy: { nomComplet: "asc" },
  });
}
