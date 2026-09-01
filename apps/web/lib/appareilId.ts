const CLE = "dispo-coursier-appareil-id";

/** Identifiant stable de cet appareil/navigateur, généré une seule fois et
 * conservé en localStorage — sert à lier le code d'accès borne à l'appareil
 * du gardien (cf. codeBorneService côté API). Ne s'appuie sur aucun compte :
 * la borne est une page publique. */
export function getAppareilId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(CLE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLE, id);
    }
    return id;
  } catch {
    // stockage indisponible (navigation privée, quota) — un id éphémère
    // évite de planter l'appli ; l'authentification devra juste être refaite
    // à chaque rechargement dans ce cas.
    return crypto.randomUUID();
  }
}
