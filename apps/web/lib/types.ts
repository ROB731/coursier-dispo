export type Statut = "DISPONIBLE" | "NON_DISPONIBLE";

export type Role = "SUPER_ADMIN" | "DIRECTEUR" | "GERANTE";

export interface Entreprise {
  id: string;
  nom: string;
  actif: boolean;
}

export interface Utilisateur {
  id: string;
  identifiant: string;
  nomComplet: string;
  role: Role;
  telephone?: string | null;
  email?: string | null;
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
  entrepriseId: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  estSitePrincipal: boolean;
  actif: boolean;
}

export type JourSemaine = "LUN" | "MAR" | "MER" | "JEU" | "VEN" | "SAM" | "DIM";

export interface PlageHoraire {
  debut: string;
  fin: string;
}

export type Horaires = Partial<Record<JourSemaine, PlageHoraire>>;

export interface ProfilHoraire {
  id: string;
  entrepriseId: string;
  nom: string;
  horaires: Horaires;
  estParDefaut: boolean;
  actif: boolean;
}

export interface ActiviteItem {
  id: string;
  nomUtilisateur: string;
  action: string;
  cible: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: "COURSIER_ARRIVE" | "AUCUN_DISPONIBLE";
  message: string;
  lu: boolean;
  envoyeAt: string;
}

export interface Compte {
  id: string;
  identifiant: string;
  nomComplet: string;
  role: Role;
  telephone: string | null;
  email: string | null;
  siteParDefautId: string | null;
  entrepriseId: string | null;
  entreprise: { nom: string } | null;
  directeurId: string | null;
  directeur: { nomComplet: string } | null;
  directeurEntreprises: { entrepriseId: string; entreprise: { nom: string } }[];
  actif: boolean;
  derniereConnexionAt: string | null;
}

export interface DirecteurResume {
  id: string;
  nomComplet: string;
  directeurEntreprises: { entrepriseId: string }[];
}

export type TypeEvenement = "ENTREE" | "SORTIE" | "ANNULATION" | "CLOTURE_AUTO";
export type SourceEvenement = "BORNE" | "COMPTE" | "SYSTEME";

export interface EvenementHistorique {
  id: string;
  type: TypeEvenement;
  source: SourceEvenement;
  horodatage: string;
  coursier: { id: string; code: string; prenom: string; nom: string };
  site: { id: string; nom: string };
  terminal: { nom: string } | null;
  creeParUtilisateur: { id: string; nomComplet: string } | null;
  evenementAnnule: { type: TypeEvenement; horodatage: string } | null;
}

export type TypeContrat = "CDI" | "CDD" | "STAGIAIRE" | "PRESTATAIRE";

export interface Coursier {
  id: string;
  code: string;
  photoUrl: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  dateNaissance: string | null;
  adresse: string | null;
  typeContrat: TypeContrat | null;
  dateEmbauche: string | null;
  contactUrgenceNom: string | null;
  contactUrgenceTelephone: string | null;
  notes: string | null;
  statutActif: boolean;
  profilHoraireId: string;
  multiSiteActive: boolean;
}
