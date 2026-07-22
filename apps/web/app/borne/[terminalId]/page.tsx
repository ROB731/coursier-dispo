"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { CoursierBorne } from "@/lib/types";
import { CoursierCard } from "@/components/CoursierCard";
import { ConfirmationModal } from "@/components/ConfirmationModal";
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

  const chargerCoursiers = useCallback(async () => {
    try {
      const data = await api.get<ReponseBorne>(`/api/bornes/${terminalId}/coursiers`);
      setNomBorne(data.terminal.nom);
      setCoursiers(data.coursiers);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Borne indisponible — vérifiez la connexion");
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
    <main>
      <div className="top-bar">
        <strong>DISPO-COURSIER · {nomBorne || "Borne"}</strong>
        <input
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

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

      {selection && (
        <ConfirmationModal
          coursier={selection}
          enCours={enCours}
          onConfirm={confirmerAction}
          onClose={() => setSelection(null)}
        />
      )}

      {toast && <Toast message={toast.message} onUndo={annulerDerniereAction} />}
    </main>
  );
}
