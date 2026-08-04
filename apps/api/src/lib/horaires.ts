import { Prisma } from "@prisma/client";

// Le type Prisma `JourSemaine` n'est généré que si l'enum est référencé par une
// colonne du schéma ; `horaires` étant un Json libre, on redéfinit les jours ici.
export type JourSemaine = "LUN" | "MAR" | "MER" | "JEU" | "VEN" | "SAM" | "DIM";
export const JOURS_SEMAINE: JourSemaine[] = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

export interface PlageHoraire {
  debut: string; // "HH:mm"
  fin: string;
}

export type Horaires = Partial<Record<JourSemaine, PlageHoraire>>;

export function horairesDuJour(horaires: Prisma.JsonValue, jour: JourSemaine): PlageHoraire | null {
  if (!horaires || typeof horaires !== "object" || Array.isArray(horaires)) return null;
  const plage = (horaires as Record<string, unknown>)[jour];
  if (!plage || typeof plage !== "object") return null;
  const { debut, fin } = plage as Record<string, unknown>;
  if (typeof debut !== "string" || typeof fin !== "string") return null;
  return { debut, fin };
}

/** Combine le jour calendaire de `date` avec une heure "HH:mm" donnée. */
export function combinerDateEtHeure(date: Date, heureHHmm: string): Date {
  const [heures, minutes] = heureHHmm.split(":").map(Number);
  const resultat = new Date(date);
  resultat.setHours(heures, minutes, 0, 0);
  return resultat;
}
