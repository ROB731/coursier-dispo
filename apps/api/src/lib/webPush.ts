import webpush from "web-push";
import { env } from "../env";
import { prisma } from "./prisma";

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
  subscription: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: { titre: string; corps: string }
) {
  if (!configured) return;
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify({ title: payload.titre, body: payload.corps })
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404/410 : le service de push a définitivement invalidé cet abonnement
    // (désinstallation, changement de navigateur…) — inutile de réessayer,
    // on le retire pour ne pas accumuler des adresses mortes indéfiniment.
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(async () => {
        await prisma.pushSubscriptionBorne.delete({ where: { id: subscription.id } }).catch(() => {});
      });
      return;
    }
    console.error("Échec d'envoi Web Push", err);
  }
}
