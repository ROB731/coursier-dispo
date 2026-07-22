import webpush from "web-push";
import { env } from "../env";

let configured = false;

export function configurerWebPush() {
  if (configured) return;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY absents — les notifications Web Push sont désactivées");
    return;
  }
  webpush.setVapidDetails(env.VAPID_CONTACT_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
}

export async function envoyerPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { titre: string; corps: string }
) {
  if (!configured) return;
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify({ title: payload.titre, body: payload.corps })
    );
  } catch (err) {
    console.error("Échec d'envoi Web Push", err);
  }
}
