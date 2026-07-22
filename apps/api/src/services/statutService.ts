import { JourSemaine, ProfilHoraire } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type Statut = "DISPONIBLE" | "NON_DISPONIBLE";

const JOURS_PAR_INDEX_JS: JourSemaine[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

function estMemeJourCalendaire(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function estDansPlageHoraire(profil: ProfilHoraire, maintenant: Date): boolean {
  const jourActuel = JOURS_PAR_INDEX_JS[maintenant.getDay()];
  if (!profil.joursApplicables.includes(jourActuel)) return false;

  const [heureDebut, minuteDebut] = profil.heureDebut.split(":").map(Number);
  const [heureFin, minuteFin] = profil.heureFin.split(":").map(Number);
  const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();

  return minutesActuelles >= heureDebut * 60 + minuteDebut && minutesActuelles <= heureFin * 60 + minuteFin;
}

/**
 * Statut dérivé à la lecture — jamais stocké. Garde-fou indépendant du job de
 * clôture automatique (docs/01-product-discovery.md §4.4) : en dehors des
 * horaires du profil du coursier, ou si le dernier événement date d'un autre
 * jour, l'état retombe à NON_DISPONIBLE quel que soit le contenu brut en base.
 */
export async function calculerStatut(coursierId: string, maintenant: Date = new Date()): Promise<Statut> {
  const dernier = await prisma.evenement.findFirst({
    where: {
      coursierId,
      type: { in: ["ENTREE", "SORTIE", "CLOTURE_AUTO"] },
      annulePar: null,
    },
    orderBy: { horodatage: "desc" },
    include: { coursier: { include: { profilHoraire: true } } },
  });

  if (!dernier || dernier.type !== "ENTREE") return "NON_DISPONIBLE";

  if (!estMemeJourCalendaire(dernier.horodatage, maintenant)) return "NON_DISPONIBLE";
  if (!estDansPlageHoraire(dernier.coursier.profilHoraire, maintenant)) return "NON_DISPONIBLE";

  return "DISPONIBLE";
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

      return {
        coursierId: coursier.id,
        code: coursier.code,
        prenom: coursier.prenom,
        nom: coursier.nom,
        photoUrl: coursier.photoUrl,
        statut: await calculerStatut(coursier.id, maintenant),
        depuis: dernier?.horodatage ?? null,
      };
    })
  );

  return statuts.sort((a, b) => {
    if (a.statut === b.statut) return a.code.localeCompare(b.code);
    return a.statut === "DISPONIBLE" ? -1 : 1;
  });
}
