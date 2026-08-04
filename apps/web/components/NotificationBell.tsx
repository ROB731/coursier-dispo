"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import { NotificationItem } from "@/lib/types";
import { activerNotificationsPush, statutPermissionNotifications } from "@/lib/pushNotifications";
import { IconBell, IconCheck } from "@/components/icons";

const INTERVALLE_MS = 20_000;

function formaterDate(iso: string): string {
  const date = new Date(iso);
  const maintenant = new Date();
  const memeJour =
    date.getFullYear() === maintenant.getFullYear() && date.getMonth() === maintenant.getMonth() && date.getDate() === maintenant.getDate();
  return memeJour
    ? `Aujourd'hui · ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function LigneNotification({ notification, onClic }: { notification: NotificationItem; onClic: () => void }) {
  return (
    <button
      type="button"
      onClick={onClic}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.5rem",
        width: "100%",
        textAlign: "left",
        padding: "0.6rem",
        borderRadius: "var(--radius-sm)",
        background: notification.lu ? "transparent" : "var(--color-primary-soft)",
        marginBottom: "0.2rem",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          marginTop: "0.4rem",
          flexShrink: 0,
          background: notification.lu ? "transparent" : "var(--color-primary)",
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: notification.lu ? 400 : 600, color: notification.lu ? "var(--color-text-muted)" : "var(--color-text)" }}>
          {notification.message}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{formaterDate(notification.envoyeAt)}</div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "indisponible">("default");
  const conteneurRef = useRef<HTMLDivElement>(null);

  async function charger() {
    try {
      setNotifications(await api.get<NotificationItem[]>("/api/notifications"));
    } catch {
      // silencieux — le badge reste sur son dernier état connu
    }
  }

  useEffect(() => {
    charger();
    statutPermissionNotifications().then(setPermission);
    const intervalle = setInterval(charger, INTERVALLE_MS);
    return () => clearInterval(intervalle);
  }, []);

  useEffect(() => {
    function onClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", onClicExterieur);
    return () => document.removeEventListener("mousedown", onClicExterieur);
  }, []);

  async function activer() {
    const ok = await activerNotificationsPush();
    setPermission(await statutPermissionNotifications());
    if (!ok) return;
  }

  async function marquerLue(id: string) {
    await api.patch(`/api/notifications/${id}/lu`);
    setNotifications((liste) => liste.map((n) => (n.id === id ? { ...n, lu: true } : n)));
  }

  async function toutMarquerLu() {
    await api.patch("/api/notifications/lu");
    setNotifications((liste) => liste.map((n) => ({ ...n, lu: true })));
  }

  const nonLues = notifications.filter((n) => !n.lu);
  const lues = notifications.filter((n) => n.lu);

  return (
    <div ref={conteneurRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-text"
        aria-label="Notifications"
        onClick={() => setOuvert((v) => !v)}
        style={{ position: "relative", display: "inline-flex" }}
      >
        <IconBell size={19} />
        {nonLues.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              background: "var(--color-non-disponible)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.65rem",
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {nonLues.length > 9 ? "9+" : nonLues.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="card notification-panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.2rem 0.4rem 0.5rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Notifications</strong>
            {nonLues.length > 0 && (
              <button
                type="button"
                className="btn-text"
                onClick={toutMarquerLu}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem" }}
              >
                <IconCheck size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>

          {permission !== "granted" && permission !== "indisponible" && (
            <div style={{ padding: "0.6rem", borderBottom: "1px solid var(--color-border)", marginBottom: "0.4rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Activez les notifications pour être alerté dès qu&apos;un coursier arrive.
              </p>
              <button type="button" className="btn btn-secondary" style={{ width: "100%" }} onClick={activer}>
                Activer les notifications
              </button>
            </div>
          )}

          {notifications.length === 0 && (
            <p style={{ padding: "0.75rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Aucune notification pour le moment.
            </p>
          )}

          {nonLues.length > 0 && (
            <>
              <div style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-primary)" }}>
                Nouvelles
              </div>
              {nonLues.map((n) => (
                <LigneNotification key={n.id} notification={n} onClic={() => marquerLue(n.id)} />
              ))}
            </>
          )}

          {lues.length > 0 && (
            <>
              <div style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                Anciennes
              </div>
              {lues.map((n) => (
                <LigneNotification key={n.id} notification={n} onClic={() => marquerLue(n.id)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
