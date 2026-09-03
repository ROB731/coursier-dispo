"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { CoursierBorne, HistoriqueCoursierJour } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { IconArrowLeft, IconArrowRight } from "@/components/icons";

const LIBELLE_TYPE: Record<string, string> = {
  ENTREE: "Entrée",
  SORTIE: "Sortie",
  ANNULATION: "Annulation",
  CLOTURE_AUTO: "Clôture auto.",
};

function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function decalerJour(dateISO: string, delta: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return formatDateISO(d);
}

function formatDateLisible(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00`);
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/** Ouvert au clic sur un coursier quand l'appareil est authentifié en
 * CONSULTATION — remplace le modal Entrée/Sortie par une vue lecture seule,
 * avec navigation vers les jours précédents. */
export function HistoriqueCoursierModal({
  terminalId,
  coursier,
  onClose,
}: {
  terminalId: string;
  coursier: CoursierBorne;
  onClose: () => void;
}) {
  const [date, setDate] = useState(() => formatDateISO(new Date()));
  const [historique, setHistorique] = useState<HistoriqueCoursierJour | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setChargement(true);
    setErreur(null);
    api
      .get<HistoriqueCoursierJour>(`/api/bornes/${terminalId}/coursiers/${coursier.id}/historique?date=${date}`)
      .then(setHistorique)
      .catch((err) => setErreur(err instanceof ApiError ? err.message : "Échec du chargement"))
      .finally(() => setChargement(false));
  }, [terminalId, coursier.id, date]);

  const aujourdHui = formatDateISO(new Date());
  const estAujourdhui = date === aujourdHui;

  return (
    <Modal titre={`${coursier.prenom} ${coursier.nom}`} onClose={onClose} maxWidth="24rem">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn-text"
          onClick={() => setDate((d) => decalerJour(d, -1))}
          aria-label="Jour précédent"
          style={{ padding: "0.4rem" }}
        >
          <IconArrowLeft size={16} />
        </button>
        <div style={{ textAlign: "center" }}>
          <strong style={{ textTransform: "capitalize" }}>{estAujourdhui ? "Aujourd'hui" : formatDateLisible(date)}</strong>
          {!estAujourdhui && (
            <button
              type="button"
              className="btn-text"
              style={{ display: "block", margin: "0 auto", fontSize: "0.78rem" }}
              onClick={() => setDate(aujourdHui)}
            >
              Revenir à aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-text"
          onClick={() => setDate((d) => decalerJour(d, 1))}
          aria-label="Jour suivant"
          disabled={estAujourdhui}
          style={{ padding: "0.4rem" }}
        >
          <IconArrowRight size={16} />
        </button>
      </div>

      {chargement && <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>Chargement…</p>}
      {erreur && <p className="form-error">{erreur}</p>}

      {!chargement && !erreur && historique && historique.evenements.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>Aucune activité ce jour-là.</p>
      )}

      {!chargement && !erreur && historique && historique.evenements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {historique.evenements.map((e) => (
            <div
              key={e.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem" }}
            >
              <span>{LIBELLE_TYPE[e.type] ?? e.type}</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {new Date(e.horodatage).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
