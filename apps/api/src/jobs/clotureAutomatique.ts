import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { horairesDuJour, JourSemaine } from "../lib/horaires";

const JOURS_PAR_INDEX_JS: JourSemaine[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

function formatHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Clôture automatiquement, à l'heure de fin de chaque profil horaire, les
 * coursiers dont le dernier événement non annulé est une ENTREE du jour.
 * Écrit l'historique (traçabilité) — l'affichage du statut ne dépend jamais
 * uniquement de ce job (cf. statutService.calculerStatut).
 */
export async function executerClotureAutomatique(maintenant: Date = new Date()) {
  const heureActuelle = formatHHmm(maintenant);
  const jourActuel = JOURS_PAR_INDEX_JS[maintenant.getDay()];

  // Chaque entreprise décide indépendamment d'activer la clôture automatique.
  // Les horaires (par jour) sont en JSON : on filtre en mémoire plutôt qu'en SQL.
  const profilsActifs = await prisma.profilHoraire.findMany({
    where: { actif: true, entreprise: { parametres: { clotureAutoActive: true } } },
  });
  const profils = profilsActifs.filter((p) => horairesDuJour(p.horaires, jourActuel)?.fin === heureActuelle);

  for (const profil of profils) {
    const coursiers = await prisma.coursier.findMany({
      where: { profilHoraireId: profil.id, statutActif: true },
    });

    for (const coursier of coursiers) {
      const dernier = await prisma.evenement.findFirst({
        where: {
          coursierId: coursier.id,
          type: { in: ["ENTREE", "SORTIE", "CLOTURE_AUTO"] },
          annulePar: null,
        },
        orderBy: { horodatage: "desc" },
      });

      if (dernier?.type === "ENTREE") {
        await prisma.evenement.create({
          data: {
            coursierId: coursier.id,
            siteId: dernier.siteId,
            type: "CLOTURE_AUTO",
            source: "SYSTEME",
            horodatage: maintenant,
          },
        });
      }
    }
  }
}

export function demarrerJobClotureAutomatique() {
  cron.schedule("* * * * *", () => {
    executerClotureAutomatique().catch((err) => console.error("Erreur job de clôture automatique", err));
  });
}
