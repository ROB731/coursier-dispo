"use client";

import { Modal } from "@/components/Modal";

/** Modal de confirmation générique — à utiliser à la place de
 * window.confirm() pour rester cohérent avec le reste de l'interface. */
export function ConfirmModal({
  titre,
  message,
  libelleConfirmer = "Confirmer",
  enCours = false,
  onConfirm,
  onClose,
}: {
  titre: string;
  message: string;
  libelleConfirmer?: string;
  enCours?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal titre={titre} onClose={onClose} maxWidth="22rem">
      <p style={{ margin: "0 0 1.25rem", color: "var(--color-text-muted)" }}>{message}</p>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button type="button" className="btn-text" onClick={onClose} disabled={enCours} style={{ flex: 1 }}>
          Annuler
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={enCours} style={{ flex: 1 }}>
          {enCours ? "…" : libelleConfirmer}
        </button>
      </div>
    </Modal>
  );
}
