import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { getStatutsSite } from "./statutService";
import { creerNotificationAucunDisponible } from "./notificationService";

export async function getEtatJourneeSite(siteId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new NotFoundError("Site introuvable");
  return { ouverte: Boolean(site.journeeOuverteDepuis), depuis: site.journeeOuverteDepuis };
}

/**
 * Bascule d'un coup TOUS les coursiers actifs du site en Sortie, horodatée
 * à l'instant du clic — que chacun ait déjà tapé son Entrée ou non. Le
 * gardien n'a pas à attendre que tout le monde ait badgé individuellement :
 * un seul clic vaut pour toute l'équipe qui part en tournée.
 */
export async function demarrerJourneeSite(siteId: string, terminalId: string) {
  const statuts = await getStatutsSite(siteId);
  const yAvaitDesDisponibles = statuts.some((s) => s.statut === "DISPONIBLE");
  const maintenant = new Date();

  // Transaction : créer les événements en masse puis marquer le site ouvert
  // doit réussir ensemble ou pas du tout — sinon un échec entre les deux
  // laisserait le bouton dans le mauvais état et risquerait de dupliquer
  // les sorties au prochain clic. createMany avec un tableau vide est évité
  // explicitement plutôt que de compter sur un comportement Prisma non garanti.
  await prisma.$transaction([
    ...(statuts.length > 0
      ? [
          prisma.evenement.createMany({
            data: statuts.map((s) => ({
              coursierId: s.coursierId,
              siteId,
              type: "SORTIE" as const,
              source: "BORNE" as const,
              terminalId,
              horodatage: maintenant,
            })),
          }),
        ]
      : []),
    prisma.site.update({ where: { id: siteId }, data: { journeeOuverteDepuis: maintenant } }),
  ]);

  // Notification (I/O externe) hors transaction — seulement si ça change
  // réellement quelque chose (au moins un coursier était disponible avant).
  if (yAvaitDesDisponibles) await creerNotificationAucunDisponible(siteId);

  return getEtatJourneeSite(siteId);
}

/**
 * Bascule d'un coup TOUS les coursiers actifs du site en Clôture, horodatée
 * à l'instant du clic — symétrique de demarrerJourneeSite. Comme pour
 * Démarrer, le gardien n'a pas à se soucier de qui est encore disponible ou
 * non : un seul clic vaut pour toute l'équipe affichée à la borne, et
 * rafraîchit au passage l'horodatage affiché sur chaque carte à l'heure
 * réelle de la fermeture plutôt que de laisser certaines cartes bloquées sur
 * un ancien événement (ex. la clôture automatique de la veille).
 */
export async function fermerJourneeSite(siteId: string) {
  const statuts = await getStatutsSite(siteId);
  const maintenant = new Date();

  await prisma.$transaction([
    ...(statuts.length > 0
      ? [
          prisma.evenement.createMany({
            data: statuts.map((s) => ({
              coursierId: s.coursierId,
              siteId,
              type: "CLOTURE_AUTO" as const,
              source: "BORNE" as const,
              horodatage: maintenant,
            })),
          }),
        ]
      : []),
    prisma.site.update({ where: { id: siteId }, data: { journeeOuverteDepuis: null } }),
  ]);

  return getEtatJourneeSite(siteId);
}
