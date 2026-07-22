import cron from "node-cron";
import { JourSemaine } from "@prisma/client";
import { prisma } from "../lib/prisma";

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
  const parametres = await prisma.parametresApplication.findFirst();
  if (!parametres?.clotureAutoActive) return;

  const heureActuelle = formatHHmm(maintenant);
  const jourActuel = JOURS_PAR_INDEX_JS[maintenant.getDay()];

  const profils = await prisma.profilHoraire.findMany({
    where: { actif: true, heureFin: heureActuelle, joursApplicables: { has: jourActuel } },
  });

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
