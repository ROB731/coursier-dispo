import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { entrepriseAccessible } from "./perimetreService";

export interface CreerTerminalInput {
  nom: string;
  siteId: string;
}

async function verifierSiteAccessible(siteId: string, entreprisesAccessibles: string[] | null) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new NotFoundError("Site introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas ce site");
  }
}

export async function creerTerminal(input: CreerTerminalInput, entreprisesAccessibles: string[] | null) {
  await verifierSiteAccessible(input.siteId, entreprisesAccessibles);
  return prisma.terminal.create({ data: input, include: { site: true } });
}

export async function modifierTerminal(
  id: string,
  input: Partial<CreerTerminalInput> & { actif?: boolean },
  entreprisesAccessibles: string[] | null,
  auteur: { id: string; nomComplet: string }
) {
  const terminal = await prisma.terminal.findUnique({ where: { id }, include: { site: true } });
  if (!terminal) throw new NotFoundError("Borne introuvable");
  if (!entrepriseAccessible(entreprisesAccessibles, terminal.site.entrepriseId)) {
    throw new ForbiddenError("Vous ne gérez pas cette borne");
  }
  if (input.siteId) await verifierSiteAccessible(input.siteId, entreprisesAccessibles);

  // Traçabilité : on fige qui a désactivé le point, et on efface la trace à
  // la réactivation — la page publique s'appuie dessus pour expliquer l'arrêt.
  const audit =
    input.actif === false
      ? { desactiveParId: auteur.id, desactiveParNom: auteur.nomComplet, desactiveLe: new Date() }
      : input.actif === true
        ? { desactiveParId: null, desactiveParNom: null, desactiveLe: null }
        : {};

  return prisma.terminal.update({ where: { id }, data: { ...input, ...audit }, include: { site: true } });
}

export async function listerTerminaux(entreprisesAccessibles: string[] | null) {
  return prisma.terminal.findMany({
    where: entreprisesAccessibles === null ? undefined : { site: { entrepriseId: { in: entreprisesAccessibles } } },
    include: { site: true },
    orderBy: { nom: "asc" },
  });
}
