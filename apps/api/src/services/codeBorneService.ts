import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { AuthentificationBorneRequiseError, ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

const SALT_ROUNDS = 12;
const LONGUEUR_CODE = 4;

/** Liste exposée au Super Admin — jamais le hash. */
export async function listerCodesBorne() {
  const codes = await prisma.codeAccesBorne.findMany({ orderBy: { createdAt: "asc" } });
  return codes.map((c) => ({
    id: c.id,
    nom: c.nom,
    actif: c.actif,
    appareilLie: Boolean(c.appareilId),
    lieLe: c.lieLe,
  }));
}

function genererCode(): string {
  const min = 10 ** (LONGUEUR_CODE - 1);
  const max = 10 ** LONGUEUR_CODE - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/** Crée un nouveau code, actif immédiatement. Le code en clair n'est
 * retourné qu'ici, une seule fois — à communiquer à la personne concernée
 * immédiatement. */
export async function genererCodeBorne(nom: string) {
  const code = genererCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  const cree = await prisma.codeAccesBorne.create({
    data: { nom, codeHash },
  });

  return { id: cree.id, nom: cree.nom, code };
}

async function trouverCode(id: string) {
  const code = await prisma.codeAccesBorne.findUnique({ where: { id } });
  if (!code) throw new NotFoundError("Code introuvable");
  return code;
}

export async function activerCodeBorne(id: string, actif: boolean) {
  await trouverCode(id);
  await prisma.codeAccesBorne.update({ where: { id }, data: { actif } });
  return listerCodesBorne();
}

/** Libère l'appareil actuellement lié à ce code, sans le changer — permet
 * de réattribuer l'accès sans en communiquer un nouveau. */
export async function delierAppareilCodeBorne(id: string) {
  await trouverCode(id);
  await prisma.codeAccesBorne.update({ where: { id }, data: { appareilId: null, lieLe: null } });
  return listerCodesBorne();
}

export async function supprimerCodeBorne(id: string) {
  await trouverCode(id);
  await prisma.codeAccesBorne.delete({ where: { id } });
  return listerCodesBorne();
}

/** Appelée par la borne (page publique, pas de compte) quand le modal
 * d'authentification est soumis. Compare le code saisi à chaque code actif
 * (pas de recherche directe possible, les codes sont hachés) ; lie
 * l'appareil au premier succès. Un appareil déjà lié à ce code précis sur
 * un autre appareil est refusé jusqu'à ce que le Super Admin le délie. */
export async function authentifierAppareilBorne(code: string, appareilId: string) {
  const codesActifs = await prisma.codeAccesBorne.findMany({ where: { actif: true } });

  for (const candidat of codesActifs) {
    const valide = await bcrypt.compare(code, candidat.codeHash);
    if (!valide) continue;

    if (candidat.appareilId && candidat.appareilId !== appareilId) {
      throw new ForbiddenError("Ce code est déjà utilisé sur un autre appareil — contactez le Super Administrateur");
    }

    await prisma.codeAccesBorne.update({
      where: { id: candidat.id },
      data: { appareilId, lieLe: new Date() },
    });
    return;
  }

  throw new UnauthorizedError("Code incorrect");
}

/** Garde-fou appelé avant toute modification d'état d'un coursier à la
 * borne. Ne fait rien si aucun code actif n'existe (fonctionnalité
 * désactivée) — sinon exige que l'appareil appelant soit lié à l'un d'eux. */
export async function verifierAccesAppareilBorne(appareilId: string | undefined) {
  const codesActifs = await prisma.codeAccesBorne.findMany({ where: { actif: true } });
  if (codesActifs.length === 0) return;

  const autorise = appareilId && codesActifs.some((c) => c.appareilId === appareilId);
  if (!autorise) throw new AuthentificationBorneRequiseError();
}
