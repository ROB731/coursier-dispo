import { redirect } from "next/navigation";

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  let terminalAccueilId: string | null = null;
  try {
    const reponse = await fetch(`${apiUrl}/api/configuration/accueil`, { cache: "no-store" });
    if (reponse.ok) {
      const configuration = (await reponse.json()) as { pageAccueil?: string; terminalAccueilId?: string | null };
      if (configuration.pageAccueil === "BORNE" && configuration.terminalAccueilId) {
        terminalAccueilId = configuration.terminalAccueilId;
      }
    }
  } catch {
    // En cas d'API indisponible, l'accueil sûre reste la connexion.
  }
  if (terminalAccueilId) redirect(`/borne/${terminalAccueilId}`);
  redirect("/login");
}
