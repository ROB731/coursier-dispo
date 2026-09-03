"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { getAppareilId } from "@/lib/appareilId";
import { RoleAppareilBorne } from "@/lib/types";
import { Modal } from "@/components/Modal";

/** Modal d'authentification borne — déclenché automatiquement quand une
 * action est refusée faute de rôle suffisant, ou ouvert directement via le
 * bouton "Se connecter". Fermer sans code n'a aucun effet ; un bon code lie
 * cet appareil et reste valide jusqu'à ce que le Super Admin le désactive.
 * Un même code gardien ou un code de compte (consultation) sont acceptés
 * ici indifféremment — le rôle retourné dit ce que cet appareil peut faire. */
export function AuthentificationBorneModal({
  onSucces,
  onClose,
}: {
  onSucces: (role: RoleAppareilBorne) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const role = await api.post<RoleAppareilBorne>("/api/bornes/authentifier", { code, appareilId: getAppareilId() });
      onSucces(role);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'authentification");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal titre="Authentification" onClose={onClose} maxWidth="22rem">
      <form onSubmit={soumettre}>
        <p style={{ margin: "0 0 1rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Entrez votre code d&apos;accès — celui du gardien ou celui de votre compte.
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
