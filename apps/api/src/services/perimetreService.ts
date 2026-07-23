import { prisma } from "../lib/prisma";

/**
 * Retourne les IDs des entreprises accessibles à un utilisateur.
 * `null` signifie "toutes les entreprises" (SUPER_ADMIN — accès plateforme).
 * Un GERANTE hérite du périmètre de son directeur si `directeurId` est
 * renseigné, sinon utilise son rattachement direct `entrepriseId`.
 */
export async function getEntreprisesAccessibles(utilisateurId: string): Promise<string[] | null> {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: {
      directeurEntreprises: true,
      directeur: { include: { directeurEntreprises: true } },
    },
  });

  if (!utilisateur) return [];

  if (utilisateur.role === "SUPER_ADMIN") return null;

  if (utilisateur.role === "DIRECTEUR") {
    return utilisateur.directeurEntreprises.map((d) => d.entrepriseId);
  }

  // GERANTE
  if (utilisateur.entrepriseId) return [utilisateur.entrepriseId];
  if (utilisateur.directeur) return utilisateur.directeur.directeurEntreprises.map((d) => d.entrepriseId);
  return [];
}

/** true si `entrepriseId` fait partie du périmètre (ou si le périmètre est global). */
export function entrepriseAccessible(entreprisesAccessibles: string[] | null, entrepriseId: string): boolean {
  return entreprisesAccessibles === null || entreprisesAccessibles.includes(entrepriseId);
}
