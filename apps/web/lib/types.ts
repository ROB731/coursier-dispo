export type Statut = "DISPONIBLE" | "NON_DISPONIBLE";

export type Role = "SUPER_ADMIN" | "DIRECTEUR" | "GERANTE";

export interface Utilisateur {
  id: string;
  identifiant: string;
  nomComplet: string;
  role: Role;
  siteParDefautId: string | null;
}

export interface CoursierBorne {
  id: string;
  code: string;
  prenom: string;
  nom: string;
  photoUrl: string;
  statut: Statut;
}

export interface StatutCoursier {
  coursierId: string;
  code: string;
  prenom: string;
  nom: string;
  photoUrl: string;
  statut: Statut;
  depuis: string | null;
}

export interface Site {
  id: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  estSitePrincipal: boolean;
  actif: boolean;
}

export interface ProfilHoraire {
  id: string;
  nom: string;
  heureDebut: string;
  heureFin: string;
  joursApplicables: string[];
  estParDefaut: boolean;
  actif: boolean;
}

export interface Coursier {
  id: string;
  code: string;
  photoUrl: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  statutActif: boolean;
  profilHoraireId: string;
  multiSiteActive: boolean;
}
