"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { CoursierBorne } from "@/lib/types";
import { CoursierCard } from "@/components/CoursierCard";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { RecapDetailsModal } from "@/components/RecapDetailsModal";
import { Toast } from "@/components/Toast";

interface ReponseBorne {
  terminal: { id: string; siteId: string; nom: string };
  coursiers: CoursierBorne[];
}

const INTERVALLE_RAFRAICHISSEMENT_MS = 10_000;
const DUREE_TOAST_MS = 5_000;

export default function BornePage({ params }: { params: { terminalId: string } }) {
  const { terminalId } = params;
  const [nomBorne, setNomBorne] = useState<string>("");
  const [coursiers, setCoursiers] = useState<CoursierBorne[]>([]);
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<CoursierBorne | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; evenementId: string } | null>(null);
  const [detailsOuvert, setDetailsOuvert] = useState(false);

  const chargerCoursiers = useCallback(async () => {
    try {
      const data = await api.get<ReponseBorne>(`/api/bornes/${terminalId}/coursiers`);
      setNomBorne(data.terminal.nom);
      setCoursiers(data.coursiers);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Point indisponible — vérifiez la connexion");
    }
  }, [terminalId]);

  useEffect(() => {
    chargerCoursiers();
    const intervalle = setInterval(chargerCoursiers, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(intervalle);
  }, [chargerCoursiers]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), DUREE_TOAST_MS);
    return () => clearTimeout(timeout);
  }, [toast]);

  const disponibles = useMemo(() => coursiers.filter((c) => c.statut === "DISPONIBLE").length, [coursiers]);

  const coursiersFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return coursiers;
    return coursiers.filter(
      (c) => c.code.toLowerCase().includes(q) || `${c.prenom} ${c.nom}`.toLowerCase().includes(q)
    );
  }, [coursiers, recherche]);

  async function confirmerAction(type: "ENTREE" | "SORTIE") {
    if (!selection) return;
    setEnCours(true);
    try {
      const evenement = await api.post<{ id: string }>(`/api/bornes/${terminalId}/evenements`, {
        coursierId: selection.id,
        type,
      });
      setToast({
        message: `${type === "ENTREE" ? "Entrée" : "Sortie"} enregistrée pour ${selection.prenom} ${selection.nom}`,
        evenementId: evenement.id,
      });
      setSelection(null);
      await chargerCoursiers();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function annulerDerniereAction() {
    if (!toast) return;
    try {
      await api.post(`/api/bornes/${terminalId}/evenements/${toast.evenementId}/annuler`, {});
      setToast(null);
      await chargerCoursiers();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'annulation");
    }
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        onClick={() => setDetailsOuvert(true)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          padding: "0.5rem",
          background: "var(--color-primary)",
          color: "var(--color-primary-contrast)",
          fontWeight: 700,
          fontSize: "0.9rem",
        }}
      >
        {disponibles} disponible{disponibles > 1 ? "s" : ""} sur {coursiers.length} · voir le détail
      </button>

      <div className="top-bar" style={{ padding: "0.5rem 1.25rem" }}>
        <strong style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
          DISPO-COURSIER · {nomBorne || "À la porte"}
        </strong>
        <input
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ maxWidth: "13.75rem" }}
        />
      </div>

      {/* Seule cette zone défile — l'en-tête (récap + recherche) reste toujours visible */}
      <div className="scroll-region">
        {erreur && <p className="alert-banner warning">{erreur}</p>}

        {coursiersFiltres.length === 0 && !erreur && (
          <p className="container">Aucun coursier enregistré sur ce site — contactez votre administrateur.</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "1rem",
            padding: "1rem",
          }}
        >
          {coursiersFiltres.map((c) => (
            <CoursierCard key={c.id} coursier={c} onSelect={setSelection} />
          ))}
        </div>
      </div>

      {selection && (
        <ConfirmationModal
          coursier={selection}
          enCours={enCours}
          onConfirm={confirmerAction}
          onClose={() => setSelection(null)}
        />
      )}

      {toast && <Toast message={toast.message} onUndo={annulerDerniereAction} />}

      {detailsOuvert && <RecapDetailsModal coursiers={coursiers} onClose={() => setDetailsOuvert(false)} />}
    </div>
  );
}
