import { Evenement, ProfilHoraire } from "@prisma/client";
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
// Logique pure, partagée entre la version unitaire (calculerStatutDetaille)
// et la version groupée (calculerStatutsDetailleParLot) — le dernier
// événement et le profil horaire sont déjà chargés, aucune requête ici.
function deriverStatutDetaille(
  profilHoraire: ProfilHoraire,
  dernier: Pick<Evenement, "type" | "horodatage"> | null,
  maintenant: Date
): StatutDetaille {
  const position = positionHoraire(profilHoraire, maintenant);
  const horsPlageHoraire = position !== "dans";
  const journeeTermineeBase = position === "apres" || position === "aucune-plage";

  if (!dernier) {
    return { statut: "NON_DISPONIBLE", horsPlageHoraire, journeeTerminee: journeeTermineeBase };
  }

  if (dernier.type !== "ENTREE") return { statut: "NON_DISPONIBLE", horsPlageHoraire, journeeTerminee: journeeTermineeBase };
  if (!estMemeJourCalendaire(dernier.horodatage, maintenant)) {
    return { statut: "NON_DISPONIBLE", horsPlageHoraire: true, journeeTerminee: true };
  }
  if (horsPlageHoraire) return { statut: "NON_DISPONIBLE", horsPlageHoraire: true, journeeTerminee: journeeTermineeBase };

  return { statut: "DISPONIBLE", horsPlageHoraire: false, journeeTerminee: false };
}

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
    return deriverStatutDetaille(coursier.profilHoraire, null, maintenant);
  }

  return deriverStatutDetaille(dernier.coursier.profilHoraire, dernier, maintenant);
}

export async function calculerStatut(coursierId: string, maintenant: Date = new Date()): Promise<Statut> {
  return (await calculerStatutDetaille(coursierId, maintenant)).statut;
}

/**
 * Version groupée de calculerStatutDetaille : une seule requête (distinct
 * sur coursierId, triée par horodatage desc — DISTINCT ON côté Postgres)
 * récupère le dernier événement de TOUS les coursiers passés en argument,
 * au lieu d'une requête par coursier. C'est ce correctif qui élimine le N+1
 * qui dominait le coût de /api/statuts et /bornes/:id/coursiers.
 */
export async function calculerStatutsDetailleParLot(
  coursiers: { id: string; profilHoraire: ProfilHoraire }[],
  maintenant: Date = new Date()
): Promise<Map<string, StatutDetaille & { depuis: Date | null }>> {
  const ids = coursiers.map((c) => c.id);
  const derniers = ids.length
    ? await prisma.evenement.findMany({
        where: { coursierId: { in: ids }, type: { in: ["ENTREE", "SORTIE", "CLOTURE_AUTO"] }, annulePar: null },
        orderBy: { horodatage: "desc" },
        distinct: ["coursierId"],
      })
    : [];
  const dernierParCoursier = new Map(derniers.map((e) => [e.coursierId, e]));

  const resultats = new Map<string, StatutDetaille & { depuis: Date | null }>();
  for (const coursier of coursiers) {
    const dernier = dernierParCoursier.get(coursier.id) ?? null;
    resultats.set(coursier.id, {
      ...deriverStatutDetaille(coursier.profilHoraire, dernier, maintenant),
      depuis: dernier?.horodatage ?? null,
    });
  }
  return resultats;
}

export async function getStatutsSite(siteId: string) {
  const rattachements = await prisma.coursierSite.findMany({
    where: { siteId, actif: true, coursier: { statutActif: true } },
    include: { coursier: { include: { profilHoraire: true } } },
  });

  const coursiers = rattachements.map((r) => r.coursier);
  const details = await calculerStatutsDetailleParLot(coursiers);

  const statuts = coursiers.map((coursier) => {
    const detail = details.get(coursier.id)!;
    return {
      coursierId: coursier.id,
      code: coursier.code,
      prenom: coursier.prenom,
      nom: coursier.nom,
      photoUrl: coursier.photoUrl,
      statut: detail.statut,
      horsPlageHoraire: detail.horsPlageHoraire,
      journeeTerminee: detail.journeeTerminee,
      depuis: detail.depuis,
    };
  });

  return statuts.sort((a, b) => {
    if (a.statut === b.statut) return a.code.localeCompare(b.code);
    return a.statut === "DISPONIBLE" ? -1 : 1;
  });
}
