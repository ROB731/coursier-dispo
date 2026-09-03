"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { CoursierBorne, EtatJournee, RoleAppareilBorne } from "@/lib/types";
import { CoursierCard } from "@/components/CoursierCard";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { RecapDetailsModal } from "@/components/RecapDetailsModal";
import { Toast } from "@/components/Toast";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { IconArrowRight, IconBan, IconCheckCircle, IconChevronDown, IconDownload, IconLogIn, IconRefresh, IconUsers } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { NotificationBellBorne } from "@/components/NotificationBellBorne";
import { AuthentificationBorneModal } from "@/components/AuthentificationBorneModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { HistoriqueCoursierModal } from "@/components/HistoriqueCoursierModal";
import { getAppareilId } from "@/lib/appareilId";

interface ReponseBorneCoursiers {
  terminal: { id: string; siteId: string; nom: string };
  desactive: boolean;
  desactiveParNom: string | null;
  desactiveLe: string | null;
  coursiers: CoursierBorne[];
}

interface EvenementInstallationPWA extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DUREE_TOAST_MS = 5_000;
// Filet de sécurité, pas du temps réel : évite qu'un écran laissé sans
// interaction reste périmé indéfiniment, tout en restant très économe en
// requêtes (144/jour) — le rafraîchissement principal reste le clic sur
// Actualiser et le rechargement après chaque action.
const INTERVALLE_RAFRAICHISSEMENT_MS = 10 * 60 * 1000;

function formatHeure(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function BornePage({ params }: { params: { terminalId: string } }) {
  const { terminalId } = params;
  const [nomBorne, setNomBorne] = useState<string>("");
  const [coursiers, setCoursiers] = useState<CoursierBorne[]>([]);
  const [recherche, setRecherche] = useState("");
  const [selectionCoursier, setSelectionCoursier] = useState<CoursierBorne | null>(null);
  const [photoAgrandie, setPhotoAgrandie] = useState<CoursierBorne | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; evenementId?: string } | null>(null);
  const [detailsOuvert, setDetailsOuvert] = useState(false);
  const [invitationInstallation, setInvitationInstallation] = useState<EvenementInstallationPWA | null>(null);
  const [desactivation, setDesactivation] = useState<{ parNom: string | null; le: string | null } | null>(null);
  const [notificationsBorneActives, setNotificationsBorneActives] = useState(false);
  const [afficherRemonter, setAfficherRemonter] = useState(false);
  const [dernierRafraichissement, setDernierRafraichissement] = useState<Date | null>(null);
  const [actionEnAttente, setActionEnAttente] = useState<(() => Promise<void>) | null>(null);
  const [etatJournee, setEtatJournee] = useState<EtatJournee | null>(null);
  const [journeeEnCours, setJourneeEnCours] = useState(false);
  const [roleAppareil, setRoleAppareil] = useState<RoleAppareilBorne | null>(null);
  const [authModalOuvert, setAuthModalOuvert] = useState(false);
  const [coursierHistorique, setCoursierHistorique] = useState<CoursierBorne | null>(null);
  const [confirmationJourneeOuverte, setConfirmationJourneeOuverte] = useState(false);
  const zoneDefilementRef = useRef<HTMLDivElement>(null);

  function surDefilement() {
    setAfficherRemonter((zoneDefilementRef.current?.scrollTop ?? 0) > 300);
  }

  function remonter() {
    zoneDefilementRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  // Rafraîchissement des données : à l'ouverture, après chaque action, et
  // toutes les 10 minutes en filet de sécurité (ci-dessous). Le bouton
  // Actualiser, lui, recharge la page entière — récupère aussi le code de
  // l'appli si une mise à jour a été déployée, pas seulement les données.
  const chargerTout = useCallback(async () => {
    try {
      const data = await api.get<ReponseBorneCoursiers>(`/api/bornes/${terminalId}/coursiers`);
      setNomBorne(data.terminal.nom);
      setCoursiers(data.coursiers);
      setDesactivation(data.desactive ? { parNom: data.desactiveParNom, le: data.desactiveLe } : null);
      setErreur(null);
      setDernierRafraichissement(new Date());
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Point indisponible — vérifiez la connexion");
    }
  }, [terminalId]);

  const chargerEtatJournee = useCallback(async () => {
    try {
      setEtatJournee(await api.get<EtatJournee>(`/api/bornes/${terminalId}/journee`));
    } catch {
      // silencieux — le bouton garde son dernier état connu
    }
  }, [terminalId]);

  // Démarrer/Fermer la journée, et le comportement au clic sur un coursier,
  // dépendent du rôle de CET appareil — contrairement aux actions gardien
  // individuelles, ils ne se contentent pas de demander le code à la volée :
  // un compte en consultation ne doit jamais voir l'option de changer un état.
  const chargerRoleAppareil = useCallback(async () => {
    try {
      setRoleAppareil(
        await api.get<RoleAppareilBorne | null>(
          `/api/bornes/${terminalId}/appareil-autorise?appareilId=${encodeURIComponent(getAppareilId())}`
        )
      );
    } catch {
      setRoleAppareil(null);
    }
  }, [terminalId]);

  useEffect(() => {
    api.get<{ notificationsBorneActives?: boolean }>("/api/configuration/accueil")
      .then((configuration) => setNotificationsBorneActives(Boolean(configuration.notificationsBorneActives)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chargerTout();
    chargerEtatJournee();
    chargerRoleAppareil();
    const intervalle = setInterval(chargerTout, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(intervalle);
  }, [chargerTout, chargerEtatJournee, chargerRoleAppareil]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), DUREE_TOAST_MS);
    return () => clearTimeout(timeout);
  }, [toast]);

  const disponibles = useMemo(() => coursiers.filter((c) => c.statut === "DISPONIBLE").length, [coursiers]);

  const coursiersFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return coursiers;
    return coursiers.filter((c) => c.code.toLowerCase().includes(q) || `${c.prenom} ${c.nom}`.toLowerCase().includes(q));
  }, [coursiers, recherche]);

  // Si l'API refuse faute de code d'accès validé sur cet appareil, on garde
  // l'action en attente et on la rejoue automatiquement dès que le modal
  // d'authentification réussit — l'utilisateur n'a pas à retaper sa demande.
  async function executerOuDemanderCode(action: () => Promise<void>) {
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError && err.code === "AUTHENTIFICATION_BORNE_REQUISE") {
        setActionEnAttente(() => action);
        setAuthModalOuvert(true);
        return;
      }
      throw err;
    }
  }

  async function confirmerActionCoursier(type: "ENTREE" | "SORTIE") {
    if (!selectionCoursier) return;
    const coursier = selectionCoursier;
    setEnCours(true);
    try {
      await executerOuDemanderCode(async () => {
        const evenement = await api.post<{ id: string }>(`/api/bornes/${terminalId}/evenements`, {
          coursierId: coursier.id,
          type,
          appareilId: getAppareilId(),
        });
        setToast({
          message: `${type === "ENTREE" ? "Entrée" : "Sortie"} enregistrée pour ${coursier.prenom} ${coursier.nom}`,
          evenementId: evenement.id,
        });
        setSelectionCoursier(null);
        await chargerTout();
      });
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
    const evenementId = toast.evenementId;
    try {
      await executerOuDemanderCode(async () => {
        await api.post(`/api/bornes/${terminalId}/evenements/${evenementId}/annuler`, { appareilId: getAppareilId() });
        setToast(null);
        await chargerTout();
      });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'annulation");
    }
  }

  async function confirmerBasculerJournee() {
    const ouverte = Boolean(etatJournee?.ouverte);
    setConfirmationJourneeOuverte(false);
    setJourneeEnCours(true);
    try {
      await executerOuDemanderCode(async () => {
        const chemin = ouverte ? "fermer" : "demarrer";
        setEtatJournee(await api.post<EtatJournee>(`/api/bornes/${terminalId}/journee/${chemin}`, { appareilId: getAppareilId() }));
        await chargerTout();
      });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec de l'opération");
    } finally {
      setJourneeEnCours(false);
    }
  }

  function seConnecter() {
    setActionEnAttente(null);
    setAuthModalOuvert(true);
  }

  // Un compte en consultation ne voit jamais le choix Entrée/Sortie : le
  // clic ouvre directement l'historique du jour, en lecture seule. Pour un
  // gardien, un accès complet (ADMIN) ou un appareil pas encore authentifié,
  // le flux habituel reste inchangé — le code est demandé à la volée si
  // besoin, comme avant. Un accès complet peut aussi ouvrir l'historique
  // directement via le bouton dédié (voirHistorique), sans passer par ce
  // premier modal.
  function surClicCoursier(coursier: CoursierBorne) {
    if (roleAppareil?.role === "CONSULTATION") {
      setCoursierHistorique(coursier);
    } else {
      setSelectionCoursier(coursier);
    }
  }

  function voirHistorique(coursier: CoursierBorne) {
    setCoursierHistorique(coursier);
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
          <strong style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
            DISPO-COURSIER · {nomBorne || "À la porte"}
          </strong>
          <ConnectionStatus />
          {dernierRafraichissement && (
            <span className="connection-label" style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Actualisé à {formatHeure(dernierRafraichissement)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn-text"
            onClick={() => window.location.reload()}
            aria-label="Actualiser"
            title="Actualiser — recharge la page pour récupérer les dernières données et mises à jour"
            style={{ display: "inline-flex", alignItems: "center", padding: "0.3rem" }}
          >
            <IconRefresh size={17} />
          </button>
          {etatJournee && (roleAppareil?.role === "GARDIEN" || roleAppareil?.role === "ADMIN") && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmationJourneeOuverte(true)}
              disabled={journeeEnCours}
              title={etatJournee.ouverte ? "Fermer la journée" : "Démarrer la journée"}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap" }}
            >
              {etatJournee.ouverte ? <IconCheckCircle size={15} /> : <IconArrowRight size={15} />}
              {journeeEnCours ? "…" : etatJournee.ouverte ? "Fermer" : "Démarrer"}
            </button>
          )}
          {roleAppareil ? (
            <span
              className="connection-label"
              title={
                roleAppareil.role === "GARDIEN"
                  ? "Authentifié en tant que gardien"
                  : roleAppareil.role === "ADMIN"
                    ? `Accès complet (gardien + consultation) : ${roleAppareil.nom}`
                    : `Connecté en consultation : ${roleAppareil.nom}`
              }
              style={{
                fontSize: "0.78rem",
                color: roleAppareil.role === "ADMIN" ? "var(--color-accent)" : "var(--color-text-muted)",
                fontWeight: roleAppareil.role === "ADMIN" ? 700 : 400,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                whiteSpace: "nowrap",
              }}
            >
              <IconUsers size={14} />{" "}
              {roleAppareil.role === "GARDIEN" ? "Gardien" : roleAppareil.role === "ADMIN" ? `${roleAppareil.nom} · Accès complet` : roleAppareil.nom}
            </span>
          ) : (
            <button
              type="button"
              className="btn-text"
              onClick={seConnecter}
              aria-label="Se connecter"
              title="Se connecter avec un code d'accès"
              style={{ display: "inline-flex", alignItems: "center", padding: "0.3rem" }}
            >
              <IconUsers size={17} />
            </button>
          )}
          <NotificationBellBorne terminalId={terminalId} notificationsActivesSurCeSite={notificationsBorneActives} />
          <a
            href="/login"
            className="btn-text"
            aria-label="Ouvrir la connexion"
            title="Connexion"
            style={{ display: "inline-flex", alignItems: "center", padding: "0.3rem" }}
          >
            <IconLogIn size={17} />
          </a>
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

      {/* Seule cette zone défile — l'en-tête (récap + recherche) reste toujours visible */}
      <div className="scroll-region" style={{ flex: 1 }} ref={zoneDefilementRef} onScroll={surDefilement}>
        {erreur && <p className="alert-banner warning">{erreur}</p>}

        {coursiersFiltres.length === 0 && !erreur && (
          <p className="container">Aucun coursier enregistré sur ce site — contactez votre administrateur.</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", padding: "1rem" }}>
          {coursiersFiltres.map((c) => (
            <CoursierCard
              key={c.id}
              coursier={c}
              onSelect={surClicCoursier}
              onZoom={setPhotoAgrandie}
              onHistorique={roleAppareil?.role === "ADMIN" ? voirHistorique : undefined}
            />
          ))}
        </div>
      </div>

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

      {photoAgrandie && (
        <Modal titre={`Photo de ${photoAgrandie.prenom} ${photoAgrandie.nom}`} onClose={() => setPhotoAgrandie(null)} maxWidth="34rem">
          <img
            src={photoAgrandie.photoUrl}
            alt={`Photo de ${photoAgrandie.prenom} ${photoAgrandie.nom}`}
            style={{ display: "block", width: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "0.5rem" }}
          />
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0.75rem 0 0" }}>
            {photoAgrandie.code}
          </p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} onUndo={toast.evenementId ? annulerDerniereAction : undefined} />}

      {detailsOuvert && (
        <RecapDetailsModal
          coursiers={coursiers}
          onAction={(c) => {
            setDetailsOuvert(false);
            surClicCoursier(c);
          }}
          onHistorique={
            roleAppareil?.role === "ADMIN"
              ? (c) => {
                  setDetailsOuvert(false);
                  voirHistorique(c);
                }
              : undefined
          }
          onClose={() => setDetailsOuvert(false)}
        />
      )}

      {authModalOuvert && (
        <AuthentificationBorneModal
          onClose={() => {
            setAuthModalOuvert(false);
            setActionEnAttente(null);
          }}
          onSucces={(role) => {
            const action = actionEnAttente;
            setAuthModalOuvert(false);
            setActionEnAttente(null);
            setRoleAppareil(role);
            action?.();
          }}
        />
      )}

      {coursierHistorique && (
        <HistoriqueCoursierModal
          terminalId={terminalId}
          coursier={coursierHistorique}
          onClose={() => setCoursierHistorique(null)}
        />
      )}

      {confirmationJourneeOuverte && (
        <ConfirmModal
          titre={etatJournee?.ouverte ? "Fermer la journée" : "Démarrer la journée"}
          message={
            etatJournee?.ouverte
              ? "Tous les coursiers encore disponibles seront clôturés."
              : "Tous les coursiers seront basculés en Sortie, qu'ils aient badgé leur entrée ou non."
          }
          libelleConfirmer={etatJournee?.ouverte ? "Fermer" : "Démarrer"}
          enCours={journeeEnCours}
          onConfirm={confirmerBasculerJournee}
          onClose={() => setConfirmationJourneeOuverte(false)}
        />
      )}
    </div>
  );
}
