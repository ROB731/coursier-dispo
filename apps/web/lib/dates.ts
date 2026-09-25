/** Affiche la date et l'heure exactes du dernier événement (Entrée ou
 * Sortie) d'un coursier, sans parler de "depuis" qui suggère une durée. La
 * date reste affichée même pour aujourd'hui — sans elle, un coursier
 * inactif depuis plusieurs jours a pu ressembler à une activité du jour. */
export function formatDepuis(depuis: string | null): string {
  if (!depuis) return "";
  const date = new Date(depuis);
  return `le ${date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
}
