/** "depuis 14h32" si aujourd'hui, sinon date+heure complètes — utilisé
 * partout où l'heure du dernier événement (Entrée ou Sortie) d'un coursier
 * est affichée : borne, dashboard Gérante/Directeur, récap détaillé. */
export function formatDepuis(depuis: string | null): string {
  if (!depuis) return "";
  const date = new Date(depuis);
  const maintenant = new Date();
  const memeJour =
    date.getFullYear() === maintenant.getFullYear() && date.getMonth() === maintenant.getMonth() && date.getDate() === maintenant.getDate();
  return memeJour
    ? `depuis ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : `depuis le ${date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
}
