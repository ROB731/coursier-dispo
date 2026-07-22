"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { Utilisateur } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { utilisateur } = await api.post<{ utilisateur: Utilisateur }>("/api/auth/login", {
        identifiant,
        motDePasse,
        seSouvenir,
      });
      router.push(utilisateur.role === "SUPER_ADMIN" ? "/admin/coursiers" : "/app");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 380, marginTop: "4rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>DISPO-COURSIER</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: "1.5rem" }}>
        <div className="form-field">
          <label htmlFor="identifiant">Identifiant</label>
          <input
            id="identifiant"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            id="seSouvenir"
            type="checkbox"
            style={{ width: "auto", minHeight: "auto" }}
            checked={seSouvenir}
            onChange={(e) => setSeSouvenir(e.target.checked)}
          />
          <label htmlFor="seSouvenir" style={{ marginBottom: 0 }}>
            Se souvenir de moi
          </label>
        </div>
        {erreur && <p className="form-error">{erreur}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
