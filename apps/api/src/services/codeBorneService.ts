import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { AuthentificationBorneRequiseError, ForbiddenError, UnauthorizedError } from "../lib/errors";

const SALT_ROUNDS = 12;
const LONGUEUR_CODE = 6;

async function getConfiguration() {
  return prisma.configurationPlateforme.findUnique({ where: { id: "global" } });
}

/** Statut exposé au Super Admin — jamais le hash. */
export async function getStatutCodeBorne() {
  const configuration = await getConfiguration();
  return {
    configure: Boolean(configuration?.codeBorneHash),
    actif: Boolean(configuration?.codeBorneActif),
    appareilLie: Boolean(configuration?.codeBorneAppareilId),
    lieLe: configuration?.codeBorneLieLe ?? null,
  };
}

function genererCode(): string {
  const min = 10 ** (LONGUEUR_CODE - 1);
  const max = 10 ** LONGUEUR_CODE - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/** Génère un nouveau code, l'active, et délie l'appareil précédent (nouveau
 * code = nouvelle attribution). Le code en clair n'est retourné qu'ici,
 * une seule fois — à communiquer au gardien immédiatement. */
export async function genererCodeBorne() {
  const code = genererCode();
  const codeBorneHash = await bcrypt.hash(code, SALT_ROUNDS);

  await prisma.configurationPlateforme.upsert({
    where: { id: "global" },
    create: { id: "global", codeBorneHash, codeBorneActif: true, codeBorneAppareilId: null, codeBorneLieLe: null },
    update: { codeBorneHash, codeBorneActif: true, codeBorneAppareilId: null, codeBorneLieLe: null },
  });

  return { code };
}

export async function activerCodeBorne(actif: boolean) {
  const configuration = await getConfiguration();
  if (!configuration?.codeBorneHash) throw new ForbiddenError("Aucun code n'a encore été généré");

  await prisma.configurationPlateforme.update({
    where: { id: "global" },
    data: { codeBorneActif: actif },
  });

  return getStatutCodeBorne();
}

/** Libère l'appareil actuellement lié, sans changer le code — permet de
 * réattribuer l'accès à une autre tablette sans en communiquer un nouveau. */
export async function delierAppareilBorne() {
  await prisma.configurationPlateforme.update({
    where: { id: "global" },
    data: { codeBorneAppareilId: null, codeBorneLieLe: null },
  });

  return getStatutCodeBorne();
}

/** Appelée par la borne (page publique, pas de compte) quand le modal
 * d'authentification est soumis. Lie l'appareil au premier succès ; un
 * appareil déjà lié ailleurs est refusé jusqu'à ce que le Super Admin le délie. */
export async function authentifierAppareilBorne(code: string, appareilId: string) {
  const configuration = await getConfiguration();
  if (!configuration?.codeBorneHash || !configuration.codeBorneActif) {
    throw new ForbiddenError("Aucun code d'accès n'est actuellement configuré");
  }

  const valide = await bcrypt.compare(code, configuration.codeBorneHash);
  if (!valide) throw new UnauthorizedError("Code incorrect");

  if (configuration.codeBorneAppareilId && configuration.codeBorneAppareilId !== appareilId) {
    throw new ForbiddenError("Ce code est déjà utilisé sur un autre appareil — contactez le Super Administrateur");
  }

  await prisma.configurationPlateforme.update({
    where: { id: "global" },
    data: { codeBorneAppareilId: appareilId, codeBorneLieLe: new Date() },
  });
}

/** Garde-fou appelé avant toute modification d'état d'un coursier à la
 * borne. Ne fait rien si aucun code n'est configuré/actif (fonctionnalité
 * désactivée) — sinon exige que l'appareil appelant soit celui lié. */
export async function verifierAccesAppareilBorne(appareilId: string | undefined) {
  const configuration = await getConfiguration();
  if (!configuration?.codeBorneHash || !configuration.codeBorneActif) return;

  if (!appareilId || configuration.codeBorneAppareilId !== appareilId) {
    throw new AuthentificationBorneRequiseError();
  }
}
