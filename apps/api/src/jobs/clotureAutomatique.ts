import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { combinerDateEtHeure, horairesDuJour, JourSemaine } from "../lib/horaires";

const JOURS_PAR_INDEX_JS: JourSemaine[] = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

/**
 * Clôture automatiquement les coursiers dont le dernier événement non annulé
 * est une ENTREE dont l'heure de fin de plage (calculée sur le jour de cette
 * ENTREE) est déjà passée. Écrit l'historique (traçabilité) — l'affichage du
 * statut ne dépend jamais de ce job (cf. statutService.calculerStatutDetaille).
 *
 * Volontairement conçu pour rattraper un retard plutôt que d'exiger d'être
 * appelé pile à la bonne minute : ça permet de le déclencher aussi bien via
 * un cron régulier que ponctuellement (ex. à la connexion d'un utilisateur),
 * les deux étant idempotents et complémentaires plutôt qu'exclusifs.
 */
export async function executerClotureAutomatique(maintenant: Date = new Date()) {
  // Chaque entreprise décide indépendamment d'activer la clôture automatique.
  const profilsActifs = await prisma.profilHoraire.findMany({
    where: { actif: true, entreprise: { parametres: { clotureAutoActive: true } } },
  });

  for (const profil of profilsActifs) {
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

      if (dernier?.type !== "ENTREE") continue;

      const jourEntree = JOURS_PAR_INDEX_JS[dernier.horodatage.getDay()];
      const plage = horairesDuJour(profil.horaires, jourEntree);
      if (!plage) continue;

      const heureFermeture = combinerDateEtHeure(dernier.horodatage, plage.fin);
      if (heureFermeture > maintenant) continue;

      await prisma.evenement.create({
        data: {
          coursierId: coursier.id,
          siteId: dernier.siteId,
          type: "CLOTURE_AUTO",
          source: "SYSTEME",
          horodatage: heureFermeture,
        },
      });
    }
  }
}

/** Pour les environnements avec process persistant (local, Render) — filet de sécurité. */
export function demarrerJobClotureAutomatique() {
  cron.schedule("*/5 * * * *", () => {
    executerClotureAutomatique().catch((err) => console.error("Erreur job de clôture automatique", err));
  });
}
