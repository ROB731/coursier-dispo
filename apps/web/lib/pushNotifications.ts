import { api } from "./apiClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Enregistre le service worker — sans demander de permission. Nécessaire à
 * l'installabilité PWA (Add to Home Screen), appelé pour tous les visiteurs. */
export async function enregistrerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("Échec de l'enregistrement du service worker", err);
    return null;
  }
}

export function pushDisponible(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function statutPermissionNotifications(): Promise<NotificationPermission | "indisponible"> {
  if (!pushDisponible()) return "indisponible";
  return Notification.permission;
}

/** Doit être appelé depuis un geste utilisateur explicite (clic) — les
 * navigateurs (surtout mobile/iOS) bloquent ou ignorent les demandes de
 * permission déclenchées automatiquement au chargement de la page. */
export async function activerNotificationsPush(): Promise<boolean> {
  if (!pushDisponible()) return false;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY absent — impossible d'activer les notifications push");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = (await navigator.serviceWorker.getRegistration()) ?? (await enregistrerServiceWorker());
  if (!registration) return false;

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    }));

  await api.post("/api/notifications/subscribe", subscription.toJSON());
  return true;
}
