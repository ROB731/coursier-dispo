"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { ActiviteItem } from "@/lib/types";
import { Modal } from "./Modal";

export function ActiviteModal({ onClose }: { onClose: () => void }) {
  const [activite, setActivite] = useState<ActiviteItem[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api
      .get<ActiviteItem[]>("/api/journal-activite")
      .then(setActivite)
      .finally(() => setChargement(false));
  }, []);

  return (
    <Modal titre="Journal d'activité" onClose={onClose} maxWidth="32rem">
      {chargement && <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>}

      {!chargement && activite.length === 0 && (
        <p style={{ color: "var(--color-text-muted)" }}>Aucune activité enregistrée pour le moment.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {activite.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.92rem" }}>
                <strong>{a.nomUtilisateur}</strong> — {a.action}
                {a.cible && <span style={{ color: "var(--color-text-muted)" }}> ({a.cible})</span>}
              </div>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
              {new Date(a.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
