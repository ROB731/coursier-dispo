"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Coursier, ProfilHoraire } from "@/lib/types";
import { Modal } from "./Modal";
import { libelleHoraires } from "./ProfilsHorairesModal";

const LIBELLE_TYPE_CONTRAT: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGIAIRE: "Stagiaire",
  PRESTATAIRE: "Prestataire",
};

function Champ({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null;
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{label}</div>
      <div>{valeur}</div>
    </div>
  );
}

export function CoursierDetailModal({ coursier, onClose }: { coursier: Coursier; onClose: () => void }) {
  const [profils, setProfils] = useState<ProfilHoraire[]>([]);

  useEffect(() => {
    api.get<ProfilHoraire[]>("/api/profils-horaires").then(setProfils);
  }, []);

  const profil = profils.find((p) => p.id === coursier.profilHoraireId);

  return (
    <Modal titre="Détail du coursier" onClose={onClose} maxWidth="28rem">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <img
          src={coursier.photoUrl}
          alt=""
          style={{ width: "5rem", height: "5rem", borderRadius: "50%", objectFit: "cover", background: "var(--color-border)" }}
        />
        <div>
          <strong style={{ fontSize: "1.1rem" }}>
            {coursier.prenom} {coursier.nom}
          </strong>
          <div style={{ color: "var(--color-text-muted)" }}>{coursier.code}</div>
          <span className={`badge ${coursier.statutActif ? "badge-disponible" : "badge-non-disponible"}`} style={{ marginTop: "0.35rem" }}>
            {coursier.statutActif ? "Actif" : "Désactivé"}
          </span>
        </div>
      </div>

      <h3 style={{ marginBottom: "0.5rem" }}>Coordonnées</h3>
      <Champ label="Téléphone" valeur={coursier.telephone} />
      <Champ label="Email" valeur={coursier.email} />
      <Champ label="Adresse" valeur={coursier.adresse} />
      {!coursier.telephone && !coursier.email && !coursier.adresse && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Aucune coordonnée renseignée.</p>
      )}

      <h3 style={{ marginBottom: "0.5rem", marginTop: "1.25rem" }}>Dossier</h3>
      <Champ label="Date de naissance" valeur={coursier.dateNaissance ? new Date(coursier.dateNaissance).toLocaleDateString("fr-FR") : null} />
      <Champ label="Type de contrat" valeur={coursier.typeContrat ? LIBELLE_TYPE_CONTRAT[coursier.typeContrat] : null} />
      <Champ label="Date d'embauche" valeur={coursier.dateEmbauche ? new Date(coursier.dateEmbauche).toLocaleDateString("fr-FR") : null} />
      <Champ label="Profil horaire" valeur={profil ? `${profil.nom} (${libelleHoraires(profil.horaires)})` : null} />

      {(coursier.contactUrgenceNom || coursier.contactUrgenceTelephone) && (
        <>
          <h3 style={{ marginBottom: "0.5rem", marginTop: "1.25rem" }}>Contact d&apos;urgence</h3>
          <Champ label="Nom" valeur={coursier.contactUrgenceNom} />
          <Champ label="Téléphone" valeur={coursier.contactUrgenceTelephone} />
        </>
      )}

      {coursier.notes && (
        <>
          <h3 style={{ marginBottom: "0.5rem", marginTop: "1.25rem" }}>Notes internes</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{coursier.notes}</p>
        </>
      )}
    </Modal>
  );
}
