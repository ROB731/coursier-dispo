import { TypePageAccueil } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError } from "../lib/errors";

export async function getConfigurationAccueil() {
  const configuration = await prisma.configurationPlateforme.findUnique({
    where: { id: "global" },
    include: { terminalAccueil: { select: { id: true, nom: true, actif: true, siteId: true } } },
  });

  return configuration ?? { id: "global", pageAccueil: "CONNEXION", terminalAccueilId: null, terminalAccueil: null };
}

export async function modifierConfigurationAccueil(input: {
  pageAccueil: TypePageAccueil;
  terminalAccueilId: string | null;
}) {
  if (input.pageAccueil === "BORNE") {
    if (!input.terminalAccueilId) throw new ConflictError("Sélectionnez une borne pour la page d'accueil");
    const terminal = await prisma.terminal.findUnique({ where: { id: input.terminalAccueilId } });
    if (!terminal || !terminal.actif) throw new NotFoundError("La borne sélectionnée est introuvable ou désactivée");
  }

  return prisma.configurationPlateforme.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      pageAccueil: input.pageAccueil,
      terminalAccueilId: input.pageAccueil === "BORNE" ? input.terminalAccueilId : null,
    },
    update: {
      pageAccueil: input.pageAccueil,
      terminalAccueilId: input.pageAccueil === "BORNE" ? input.terminalAccueilId : null,
    },
    include: { terminalAccueil: { select: { id: true, nom: true, actif: true, siteId: true } } },
  });
}