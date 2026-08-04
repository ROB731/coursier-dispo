"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { CoursierBorne, EmployeBorne } from "@/lib/types";
import { CoursierCard } from "@/components/CoursierCard";
import { EmployeCardBorne } from "@/components/EmployeCardBorne";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ConfirmationEmployeModal } from "@/components/ConfirmationEmployeModal";
import { RecapDetailsModal } from "@/components/RecapDetailsModal";
import { Toast } from "@/components/Toast";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { IconBan, IconChevronDown, IconDownload } from "@/components/icons";

type Onglet = "coursiers" | "employes";
type PositionOnglets = "haut" | "bas";

const CLE_POSITION_ONGLETS = "dispo-coursier:position-onglets-borne";

interface ReponseBorneCoursiers {
  terminal: { id: string; siteId: string; nom: string };
  desactive: boolean;
  desactiveParNom: string | null;
  desactiveLe: string | null;
  coursiers: CoursierBorne[];
}

interface ReponseBorneEmployes {
  terminal: { id: string; siteId: string; nom: string };
  desactive: boolean;
  employes: EmployeBorne[];
}

interface EvenementInstallationPWA extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INTERVALLE_RAFRAICHISSEMENT_MS = 10_000;
const DUREE_TOAST_MS = 5_000;

export default function BornePage({ params }: { params: { terminalId: string } }) {
  const { terminalId } = params;
  const [onglet, setOnglet] = useState<Onglet>("coursiers");
  const [positionOnglets, setPositionOnglets] = useState<PositionOnglets>("haut");
  const [nomBorne, setNomBorne] = useState<string>("");
  const [coursiers, setCoursiers] = useState<CoursierBorne[]>([]);
  const [employes, setEmployes] = useState<EmployeBorne[]>([]);
  const [recherche, setRecherche] = useState("");
  const [selectionCoursier, setSelectionCoursier] = useState<CoursierBorne | null>(null);
  const [selectionEmploye, setSelectionEmploye] = useState<EmployeBorne | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; evenementId?: string } | null>(null);
  const [detailsOuvert, setDetailsOuvert] = useState(false);
  const [invitationInstallation, setInvitationInstallation] = useState<EvenementInstallationPWA | null>(null);
  const [desactivation, setDesactivation] = useState<{ parNom: string | null; le: string | null } | null>(null);
  const [afficherRemonter, setAfficherRemonter] = useState(false);
  const zoneDefilementRef = useRef<HTMLDivElement>(null);

  function surDefilement() {
    setAfficherRemonter((zoneDefilementRef.current?.scrollTop ?? 0) > 300);
  }

  function remonter() {
    zoneDefilementRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Changer d'onglet remet la liste en haut — sinon on peut se retrouver au
  // milieu d'une liste vide en passant de Coursiers à Employés.
  useEffect(() => {
    zoneDefilementRef.current?.scrollTo({ top: 0 });
    setAfficherRemonter(false);
  }, [onglet]);

  // Capture l'invite d'installation native (Chrome/Edge/Android) pour proposer
  // un bouton "Installer" — utile ici : on ne va pas toujours rouvrir un
  // navigateur et retaper l'adresse, la tablette doit pouvoir lancer ce point
  // précis comme une app, sans passer par le site à chaque fois.
  useEffect(() => {
    function surInvite(e: Event) {
      e.preventDefault();
      setInvitationInstallation(e as EvenementInstallationPWA);
    }
    window.addEventListener("beforeinstallprompt", surInvite);
    return () => window.removeEventListener("beforeinstallprompt", surInvite);
  }, []);

  async function installer() {
    if (!invitationInstallation) return;
    await invitationInstallation.prompt();
    await invitationInstallation.userChoice;
    setInvitationInstallation(null);
  }

  // Emplacement des onglets mémorisé sur cet appareil.
  useEffect(() => {
    const stocke = window.localStorage.getItem(CLE_POSITION_ONGLETS);
    if (stocke === "haut" || stocke === "bas") setPositionOnglets(stocke);
  }, []);

  function basculerPosition() {
    const nouvelle: PositionOnglets = positionOnglets === "haut" ? "bas" : "haut";
    setPositionOnglets(nouvelle);
    window.localStorage.setItem(CLE_POSITION_ONGLETS, nouvelle);
  }

  const chargerTout = useCallback(async () => {
    try {
      const [dataCoursiers, dataEmployes] = await Promise.all([
        api.get<ReponseBorneCoursiers>(`/api/bornes/${terminalId}/coursiers`),
        api.get<ReponseBorneEmployes>(`/api/bornes/${terminalId}/employes`),
      ]);
      setNomBorne(dataCoursiers.terminal.nom);
      setCoursiers(dataCoursiers.coursiers);
      setEmployes(dataEmployes.employes);
      setDesactivation(dataCoursiers.desactive ? { parNom: dataCoursiers.desactiveParNom, le: dataCoursiers.desactiveLe } : null);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Point indisponible — vérifiez la connexion");
    }
  }, [terminalId]);

  useEffect(() => {
    chargerTout();
    const intervalle = setInterval(chargerTout, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(intervalle);
  }, [chargerTout]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), DUREE_TOAST_MS);
    return () => clearTimeout(timeout);
  }, [toast]);

  const disponibles = useMemo(() => coursiers.filter((c) => c.statut === "DISPONIBLE").length, [coursiers]);
  const presents = useMemo(() => employes.filter((e) => e.presence?.statut === "PRESENT" && !e.presence.heureSortie).length, [employes]);

  const coursiersFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return coursiers;
    return coursiers.filter((c) => c.code.toLowerCase().includes(q) || `${c.prenom} ${c.nom}`.toLowerCase().includes(q));
  }, [coursiers, recherche]);

  const employesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return employes;
    return employes.filter((e) => `${e.prenom} ${e.nom}`.toLowerCase().includes(q));
  }, [employes, recherche]);

  async function confirmerActionCoursier(type: "ENTREE" | "SORTIE") {
    if (!selectionCoursier) return;
    setEnCours(true);
    try {
      const evenement = await api.post<{ id: string }>(`/api/bornes/${terminalId}/evenements`, {
        coursierId: selectionCoursier.id,
        type,
      });
      setToast({
        message: `${type === "ENTREE" ? "Entrée" : "Sortie"} enregistrée pour ${selectionCoursier.prenom} ${selectionCoursier.nom}`,
        evenementId: evenement.id,
      });
      setSelectionCoursier(null);
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function confirmerActionEmploye(type: "ENTREE" | "SORTIE") {
    if (!selectionEmploye) return;
    setEnCours(true);
    try {
      await api.post(`/api/bornes/${terminalId}/employes/pointage`, {
        employeId: selectionEmploye.id,
        type,
      });
      setToast({
        message: `${type === "ENTREE" ? "Arrivée" : "Départ"} enregistré${type === "ENTREE" ? "e" : ""} pour ${selectionEmploye.prenom} ${selectionEmploye.nom}`,
      });
      setSelectionEmploye(null);
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setEnCours(false);
    }
  }

  async function annulerDerniereAction() {
    if (!toast?.evenementId) {
      setToast(null);
      return;
    }
    try {
      await api.post(`/api/bornes/${terminalId}/evenements/${toast.evenementId}/annuler`, {});
      setToast(null);
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'annulation");
    }
  }

  if (desactivation) {
    return (
      <div className="app-shell">
        <div className="top-bar" style={{ padding: "0.5rem 1.25rem" }}>
          <strong style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
            DISPO-COURSIER · {nomBorne || "À la porte"}
          </strong>
          <ConnectionStatus />
        </div>
        <div
          className="scroll-region container"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1rem" }}
        >
          <IconBan size={40} style={{ color: "var(--color-text-muted)" }} />
          <div>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>Ce point a été désactivé</h1>
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
              {desactivation.parNom ? (
                <>
                  Désactivé par <strong>{desactivation.parNom}</strong>
                  {desactivation.le &&
                    ` le ${new Date(desactivation.le).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}`}
                  .
                </>
              ) : (
                "Contactez votre administrateur pour le réactiver."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {onglet === "coursiers" ? (
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
      ) : (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: "0.5rem",
            background: "var(--color-primary)",
            color: "var(--color-primary-contrast)",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          {presents} présent{presents > 1 ? "s" : ""} sur {employes.length}
        </div>
      )}

      <div className="top-bar" style={{ padding: "0.5rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
          <strong style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
            DISPO-COURSIER · {nomBorne || "À la porte"}
          </strong>
          <ConnectionStatus />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {invitationInstallation && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={installer}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
            >
              <IconDownload size={15} /> Installer
            </button>
          )}
          <input
            placeholder="Rechercher…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ maxWidth: "13.75rem" }}
          />
        </div>
      </div>

      {positionOnglets === "haut" && (
        <nav className="borne-onglets" aria-label="Type de personnel">
          <button
            type="button"
            className={`borne-onglet ${onglet === "coursiers" ? "actif" : ""}`}
            onClick={() => setOnglet("coursiers")}
          >
            Coursiers
            <span className="borne-onglet-compte">{coursiers.length}</span>
          </button>
          <button
            type="button"
            className={`borne-onglet ${onglet === "employes" ? "actif" : ""}`}
            onClick={() => setOnglet("employes")}
          >
            Employés
            <span className="borne-onglet-compte">{employes.length}</span>
          </button>
          <button
            type="button"
            className="borne-onglet-bascule"
            onClick={basculerPosition}
            title="Passer la barre en bas"
            aria-label="Passer la barre d'onglets en bas de l'écran"
          >
            <IconChevronDown size={15} />
          </button>
        </nav>
      )}

      {/* Seule cette zone défile — l'en-tête (récap + recherche + onglets) reste toujours visible */}
      <div className="scroll-region" style={{ flex: 1 }} ref={zoneDefilementRef} onScroll={surDefilement}>
        {erreur && <p className="alert-banner warning">{erreur}</p>}

        {onglet === "coursiers" && (
          <>
            {coursiersFiltres.length === 0 && !erreur && (
              <p className="container">Aucun coursier enregistré sur ce site — contactez votre administrateur.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", padding: "1rem" }}>
              {coursiersFiltres.map((c) => (
                <CoursierCard key={c.id} coursier={c} onSelect={setSelectionCoursier} />
              ))}
            </div>
          </>
        )}

        {onglet === "employes" && (
          <>
            {employesFiltres.length === 0 && !erreur && (
              <p className="container">Aucun employé enregistré sur ce site — contactez votre administrateur.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", padding: "1rem" }}>
              {employesFiltres.map((e) => (
                <EmployeCardBorne key={e.id} employe={e} onSelect={setSelectionEmploye} />
              ))}
            </div>
          </>
        )}
      </div>

      {positionOnglets === "bas" && (
        <nav className="borne-onglets bas" aria-label="Type de personnel">
          <button
            type="button"
            className="borne-onglet-bascule"
            onClick={basculerPosition}
            title="Passer la barre en haut"
            aria-label="Passer la barre d'onglets en haut de l'écran"
          >
            <IconChevronDown size={15} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            type="button"
            className={`borne-onglet ${onglet === "coursiers" ? "actif" : ""}`}
            onClick={() => setOnglet("coursiers")}
          >
            Coursiers
            <span className="borne-onglet-compte">{coursiers.length}</span>
          </button>
          <button
            type="button"
            className={`borne-onglet ${onglet === "employes" ? "actif" : ""}`}
            onClick={() => setOnglet("employes")}
          >
            Employés
            <span className="borne-onglet-compte">{employes.length}</span>
          </button>
        </nav>
      )}

      {afficherRemonter && (
        <button type="button" className="bouton-remonter" onClick={remonter} aria-label="Remonter en haut de la liste" title="Remonter en haut">
          <IconChevronDown size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}

      {selectionCoursier && (
        <ConfirmationModal
          coursier={selectionCoursier}
          enCours={enCours}
          onConfirm={confirmerActionCoursier}
          onClose={() => setSelectionCoursier(null)}
        />
      )}

      {selectionEmploye && (
        <ConfirmationEmployeModal
          employe={selectionEmploye}
          enCours={enCours}
          onConfirm={confirmerActionEmploye}
          onClose={() => setSelectionEmploye(null)}
        />
      )}

      {toast && <Toast message={toast.message} onUndo={toast.evenementId ? annulerDerniereAction : undefined} />}

      {detailsOuvert && <RecapDetailsModal coursiers={coursiers} onClose={() => setDetailsOuvert(false)} />}
    </div>
  );
}
