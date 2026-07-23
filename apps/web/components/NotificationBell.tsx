"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import { NotificationItem } from "@/lib/types";
import { activerNotificationsPush, statutPermissionNotifications } from "@/lib/pushNotifications";

const INTERVALLE_MS = 20_000;

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

  const nonLues = notifications.filter((n) => !n.lu).length;

  return (
    <div ref={conteneurRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn-text"
        aria-label="Notifications"
        onClick={() => setOuvert((v) => !v)}
        style={{ position: "relative", fontSize: "1.15rem" }}
      >
        🔔
        {nonLues > 0 && (
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
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.5rem)",
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 60,
            padding: "0.5rem",
          }}
        >
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

          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => marquerLue(n.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.6rem",
                borderRadius: "var(--radius-sm)",
                background: n.lu ? "transparent" : "var(--color-primary-soft)",
                fontSize: "0.88rem",
                marginBottom: "0.2rem",
              }}
            >
              <div>{n.message}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                {new Date(n.envoyeAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
