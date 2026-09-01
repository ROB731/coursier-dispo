"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { getAppareilId } from "@/lib/appareilId";
import { Modal } from "@/components/Modal";

/** Modal déclenché automatiquement quand la borne refuse un changement
 * d'état (code AUTHENTIFICATION_BORNE_REQUISE) — demande le code permanent
 * du gardien. Fermer sans code n'a aucun effet ; un bon code lie cet
 * appareil et reste valide jusqu'à ce que le Super Admin le désactive. */
export function AuthentificationBorneModal({ onSucces, onClose }: { onSucces: () => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await api.post("/api/bornes/authentifier", { code, appareilId: getAppareilId() });
      onSucces();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'authentification");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal titre="Autorisation requise" onClose={onClose} maxWidth="22rem">
      <form onSubmit={soumettre}>
        <p style={{ margin: "0 0 1rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Seule la personne autorisée à la porte peut changer l&apos;état d&apos;un coursier. Entrez le code d&apos;accès.
        </p>
        <div className="form-field">
          <label htmlFor="code-acces-borne">Code d&apos;accès</label>
          <input
            id="code-acces-borne"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em" }}
          />
        </div>
        {erreur && <p className="form-error">{erreur}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={enCours || !code}>
          {enCours ? "Vérification…" : "Valider"}
        </button>
      </form>
    </Modal>
  );
}
