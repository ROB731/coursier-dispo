import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { envoyerPush } from "../lib/webPush";

async function destinatairesDuSite(siteId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return [];

  // Reflète exactement la logique de perimetreService.getEntreprisesAccessibles :
  // un GERANTE hérite du périmètre de son directeur s'il n'a pas de rattachement direct.
  return prisma.utilisateur.findMany({
    where: {
      actif: true,
      OR: [
        { role: "GERANTE", entrepriseId: site.entrepriseId },
        { role: "GERANTE", directeur: { directeurEntreprises: { some: { entrepriseId: site.entrepriseId } } } },
        { role: "DIRECTEUR", directeurEntreprises: { some: { entrepriseId: site.entrepriseId } } },
      ],
    },
    include: { pushSubscriptions: true },
  });
}

async function abonnementsBorneDuSite(siteId: string) {
  return prisma.pushSubscriptionBorne.findMany({
    where: { terminal: { siteId, actif: true } },
  });
}

async function notifier(siteId: string, params: { type: "COURSIER_ARRIVE" | "AUCUN_DISPONIBLE"; coursierId?: string; message: string; titre: string }) {
  const destinataires = await destinatairesDuSite(siteId);
  const abonnementsBorne = await abonnementsBorneDuSite(siteId);

  await Promise.all(
    destinataires.map(async (utilisateur) => {
      await prisma.notification.create({
        data: {
          utilisateurId: utilisateur.id,
          type: params.type,
          coursierId: params.coursierId,
          message: params.message,
        },
      });

      await Promise.all(
        utilisateur.pushSubscriptions.map((sub) =>
          envoyerPush(sub, { titre: params.titre, corps: params.message })
        )
      );
    })
  );

  await Promise.all(
    abonnementsBorne.map((sub) =>
      envoyerPush(sub, { titre: params.titre, corps: params.message })
    )
  );
}

export async function creerNotificationCoursierArrive(coursierId: string, siteId: string) {
  const coursier = await prisma.coursier.findUnique({ where: { id: coursierId } });
  if (!coursier) return;

  await notifier(siteId, {
    type: "COURSIER_ARRIVE",
    coursierId,
    titre: "Coursier disponible",
    message: `${coursier.prenom} ${coursier.nom} (${coursier.code}) vient d'arriver au siège.`,
  });
}

export async function creerNotificationAucunDisponible(siteId: string) {
  await notifier(siteId, {
    type: "AUCUN_DISPONIBLE",
    titre: "Aucun coursier disponible",
    message: "Plus aucun coursier n'est actuellement disponible sur ce site.",
  });
}

export async function listerNotifications(utilisateurId: string) {
  return prisma.notification.findMany({
    where: { utilisateurId },
    orderBy: { envoyeAt: "desc" },
    take: 100,
  });
}

export async function marquerCommeLue(notificationId: string, utilisateurId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, utilisateurId },
    data: { lu: true },
  });
}

export async function marquerToutesCommeLues(utilisateurId: string) {
  return prisma.notification.updateMany({
    where: { utilisateurId, lu: false },
    data: { lu: true },
  });
}

export async function enregistrerAbonnementPush(
  utilisateurId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const donnees = {
    utilisateurId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  };

  try {
    return await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: donnees,
      update: {
        utilisateurId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  } catch (err) {
    // Deux onglets peuvent renouveler le même abonnement en même temps :
    // si les deux upserts se présentent simultanément, le second retente en
    // mise à jour après la création concurrente du endpoint unique.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          utilisateurId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    }
    throw err;
  }
}
