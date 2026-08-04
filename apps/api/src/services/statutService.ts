import { ProfilHoraire } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { horairesDuJour, JourSemaine } from "../lib/horaires";

export type Statut = "DISPONIBLE" | "NON_DISPONIBLE";

const JOURS_PAR_INDEX_JS: JourSemaine[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

function estMemeJourCalendaire(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type PositionHoraire = "avant" | "dans" | "apres" | "aucune-plage";

/**
 * Où se situe « maintenant » par rapport à la plage horaire du profil, pour
 * aujourd'hui. Distinction cruciale : « avant » l'ouverture n'est pas la
 * même chose qu'« après » la fermeture — seul le second cas correspond à une
 * journée terminée (voir StatutDetaille.journeeTerminee).
 */
function positionHoraire(profil: ProfilHoraire, maintenant: Date): PositionHoraire {
  const jourActuel = JOURS_PAR_INDEX_JS[maintenant.getDay()];
  const plage = horairesDuJour(profil.horaires, jourActuel);
  if (!plage) return "aucune-plage";

  const [heureDebut, minuteDebut] = plage.debut.split(":").map(Number);
  const [heureFin, minuteFin] = plage.fin.split(":").map(Number);
  const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();
  const debut = heureDebut * 60 + minuteDebut;
  const fin = heureFin * 60 + minuteFin;

  if (minutesActuelles < debut) return "avant";
  if (minutesActuelles > fin) return "apres";
  return "dans";
}

export interface StatutDetaille {
  statut: Statut;
  // true dès qu'on est hors des heures de travail actuelles (avant l'ouverture,
  // après la fermeture, ou jour non travaillé).
  horsPlageHoraire: boolean;
  // true seulement après la fermeture (ou jour non travaillé) : état figé et
  // normal jusqu'au lendemain — contrairement à « avant l'ouverture », où le
  // coursier n'est simplement pas encore arrivé et peut badger normalement.
  journeeTerminee: boolean;
}

/**
 * Statut dérivé à la lecture — jamais stocké. Garde-fou indépendant du job de
 * clôture automatique (docs/01-product-discovery.md §4.4) : en dehors des
 * horaires du profil du coursier, ou si le dernier événement date d'un autre
 * jour, l'état retombe à NON_DISPONIBLE quel que soit le contenu brut en base.
 */
export async function calculerStatutDetaille(coursierId: string, maintenant: Date = new Date()): Promise<StatutDetaille> {
  const dernier = await prisma.evenement.findFirst({
    where: {
      coursierId,
      type: { in: ["ENTREE", "SORTIE", "CLOTURE_AUTO"] },
      annulePar: null,
    },
    orderBy: { horodatage: "desc" },
    include: { coursier: { include: { profilHoraire: true } } },
  });

  if (!dernier) {
    const coursier = await prisma.coursier.findUnique({ where: { id: coursierId }, include: { profilHoraire: true } });
    if (!coursier) return { statut: "NON_DISPONIBLE", horsPlageHoraire: false, journeeTerminee: false };
    const position = positionHoraire(coursier.profilHoraire, maintenant);
    return {
      statut: "NON_DISPONIBLE",
      horsPlageHoraire: position !== "dans",
      journeeTerminee: position === "apres" || position === "aucune-plage",
    };
  }

  const position = positionHoraire(dernier.coursier.profilHoraire, maintenant);
  const horsPlageHoraire = position !== "dans";
  const journeeTermineeBase = position === "apres" || position === "aucune-plage";

  if (dernier.type !== "ENTREE") return { statut: "NON_DISPONIBLE", horsPlageHoraire, journeeTerminee: journeeTermineeBase };
  if (!estMemeJourCalendaire(dernier.horodatage, maintenant)) {
    return { statut: "NON_DISPONIBLE", horsPlageHoraire: true, journeeTerminee: true };
  }
  if (horsPlageHoraire) return { statut: "NON_DISPONIBLE", horsPlageHoraire: true, journeeTerminee: journeeTermineeBase };

  return { statut: "DISPONIBLE", horsPlageHoraire: false, journeeTerminee: false };
}

export async function calculerStatut(coursierId: string, maintenant: Date = new Date()): Promise<Statut> {
  return (await calculerStatutDetaille(coursierId, maintenant)).statut;
}

export async function getStatutsSite(siteId: string) {
  const rattachements = await prisma.coursierSite.findMany({
    where: { siteId, actif: true, coursier: { statutActif: true } },
    include: { coursier: true },
  });

  const maintenant = new Date();

  const statuts = await Promise.all(
    rattachements.map(async ({ coursier }) => {
      const dernier = await prisma.evenement.findFirst({
        where: { coursierId: coursier.id, type: { in: ["ENTREE", "SORTIE", "CLOTURE_AUTO"] }, annulePar: null },
        orderBy: { horodatage: "desc" },
      });

      const detail = await calculerStatutDetaille(coursier.id, maintenant);

      return {
        coursierId: coursier.id,
        code: coursier.code,
        prenom: coursier.prenom,
        nom: coursier.nom,
        photoUrl: coursier.photoUrl,
        statut: detail.statut,
        horsPlageHoraire: detail.horsPlageHoraire,
        journeeTerminee: detail.journeeTerminee,
        depuis: dernier?.horodatage ?? null,
      };
    })
  );

  return statuts.sort((a, b) => {
    if (a.statut === b.statut) return a.code.localeCompare(b.code);
    return a.statut === "DISPONIBLE" ? -1 : 1;
  });
}
