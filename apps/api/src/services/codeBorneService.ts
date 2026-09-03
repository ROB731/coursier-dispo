import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { AuthentificationBorneRequiseError, ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

const SALT_ROUNDS = 12;
const LONGUEUR_CODE = 4;

/** Liste exposée au Super Admin — jamais le hash, ni le code en clair (même
 * pour les codes CONSULTATION : celui-ci n'est visible que par son titulaire,
 * via getCodePersonnel ci-dessous). */
export async function listerCodesBorne() {
  const codes = await prisma.codeAccesBorne.findMany({
    orderBy: { createdAt: "asc" },
    include: { utilisateur: { select: { id: true, nomComplet: true, role: true } } },
  });
  return codes.map((c) => ({
    id: c.id,
    nom: c.nom,
    role: c.role,
    utilisateur: c.utilisateur,
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

/** Code GARDIEN : accès complet, nom libre choisi par le Super Admin. Le
 * code en clair n'est retourné qu'ici, une seule fois. */
export async function genererCodeGardien(nom: string) {
  const code = genererCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  const cree = await prisma.codeAccesBorne.create({
    data: { nom, role: "GARDIEN", codeHash },
  });

  return { id: cree.id, nom: cree.nom, code };
}

/** Code CONSULTATION : lié à un compte existant, un seul par compte
 * (regénérer remplace le précédent). Contrairement au gardien, le code en
 * clair est aussi conservé (colonne `code`) pour que le titulaire puisse le
 * revoir depuis son profil sans repasser par le Super Admin. */
export async function genererCodeConsultation(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
  if (!utilisateur) throw new NotFoundError("Compte introuvable");

  const code = genererCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  const resultat = await prisma.codeAccesBorne.upsert({
    where: { utilisateurId },
    create: { nom: utilisateur.nomComplet, role: "CONSULTATION", codeHash, code, utilisateurId },
    update: { nom: utilisateur.nomComplet, codeHash, code, actif: true, appareilId: null, lieLe: null },
  });

  return { id: resultat.id, nom: resultat.nom, code };
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

/** Le titulaire d'un compte consulte son propre code CONSULTATION depuis
 * son profil — jamais exposé à personne d'autre que lui (et le Super Admin
 * au moment de la génération). */
export async function getCodePersonnel(utilisateurId: string) {
  const code = await prisma.codeAccesBorne.findUnique({ where: { utilisateurId } });
  if (!code || code.role !== "CONSULTATION") return null;
  return { code: code.code, actif: code.actif, appareilLie: Boolean(code.appareilId), lieLe: code.lieLe };
}

/** Appelée par la borne (page publique, pas de compte) quand le modal
 * d'authentification est soumis. Compare le code saisi à chaque code actif
 * (pas de recherche directe possible, les codes sont hachés) ; lie
 * l'appareil au premier succès. Un appareil déjà lié à ce code précis sur
 * un autre appareil est refusé jusqu'à ce que le Super Admin le délie.
 * Retourne le rôle du code trouvé, pour que le frontend adapte son
 * comportement (gardien = actions, consultation = lecture seule). */
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
    return { role: candidat.role, nom: candidat.nom };
  }

  throw new UnauthorizedError("Code incorrect");
}

/** Rôle actuel de cet appareil (ou null si non authentifié) — GARDIEN
 * l'emporte si l'appareil est lié à plusieurs codes actifs à la fois. */
export async function getRoleAppareilBorne(appareilId: string | undefined) {
  if (!appareilId) return null;
  const codes = await prisma.codeAccesBorne.findMany({ where: { actif: true, appareilId } });
  if (codes.length === 0) return null;
  const gardien = codes.find((c) => c.role === "GARDIEN");
  return gardien ? { role: "GARDIEN" as const, nom: gardien.nom } : { role: "CONSULTATION" as const, nom: codes[0].nom };
}

/** true si aucun code actif n'existe (fonctionnalité désactivée, tout le
 * monde autorisé par défaut) ou si cet appareil est lié à un code actif,
 * quel que soit son rôle. */
export async function estAppareilAutorise(appareilId: string | undefined): Promise<boolean> {
  const codesActifs = await prisma.codeAccesBorne.findMany({ where: { actif: true } });
  if (codesActifs.length === 0) return true;
  return Boolean(appareilId && codesActifs.some((c) => c.appareilId === appareilId));
}

/** Garde-fou pour les actions qui modifient l'état d'un coursier (Entrée/
 * Sortie/annulation, Démarrer/Fermer la journée) — exige spécifiquement le
 * rôle GARDIEN : un appareil authentifié en CONSULTATION est bloqué ici. */
export async function verifierAccesGardienBorne(appareilId: string | undefined) {
  const codesActifs = await prisma.codeAccesBorne.findMany({ where: { actif: true } });
  if (codesActifs.length === 0) return;

  const role = await getRoleAppareilBorne(appareilId);
  if (!role) throw new AuthentificationBorneRequiseError();
  if (role.role !== "GARDIEN") {
    throw new ForbiddenError("Ce compte n'est pas autorisé à modifier l'état des coursiers");
  }
}
