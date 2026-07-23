import { prisma } from "../lib/prisma";

interface EnregistrerActiviteParams {
  utilisateurId: string;
  nomUtilisateur: string;
  action: string;
  cible?: string;
}

export async function enregistrerActivite(params: EnregistrerActiviteParams): Promise<void> {
  try {
    await prisma.journalActivite.create({ data: params });
  } catch (err) {
    // La journalisation ne doit jamais faire échouer la requête métier qu'elle observe.
    console.error("Échec de journalisation de l'activité", err);
  }
}

export async function listerActivite(limite = 150) {
  return prisma.journalActivite.findMany({
    orderBy: { createdAt: "desc" },
    take: limite,
  });
}
