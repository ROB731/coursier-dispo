/** Affiche l'heure exacte du dernier événement (Entrée ou Sortie) d'un coursier,
 * sans parler de "depuis" qui suggère une durée. */
export function formatDepuis(depuis: string | null): string {
  if (!depuis) return "";
  const date = new Date(depuis);
  const maintenant = new Date();
  const memeJour =
    date.getFullYear() === maintenant.getFullYear() && date.getMonth() === maintenant.getMonth() && date.getDate() === maintenant.getDate();
  return memeJour
    ? `à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : `le ${date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
}
