"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { Utilisateur } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandIllustration } from "@/components/BrandIllustration";

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
      await api.post<{ utilisateur: Utilisateur }>("/api/auth/login", {
        identifiant,
        motDePasse,
        seSouvenir,
      });
      router.push("/admin");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="login-grid">
      <section
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)",
          color: "#ffffff",
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "1.5rem",
        }}
      >
        <BrandIllustration />
        <div>
          <h1 style={{ fontSize: "1.9rem", margin: "0 0 0.75rem" }}>DISPO-COURSIER</h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.92, maxWidth: "22.5rem", margin: "0 auto", lineHeight: 1.6 }}>
            Savoir en temps réel quels coursiers sont physiquement présents au siège — pour attribuer chaque
            course sans perdre une minute.
          </p>
        </div>
        <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>IVOIRRAPID</p>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "22.5rem", width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <ThemeToggle />
          </div>

          <h2 style={{ margin: "0 0 0.35rem" }}>Connexion</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: 0, marginBottom: "2rem" }}>
            Accédez à votre espace.
          </p>

          <form onSubmit={onSubmit}>
            <div className="form-field">
              <label htmlFor="identifiant">Identifiant</label>
              <input
                id="identifiant"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                autoComplete="username"
                required
                autoFocus
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
        </div>
      </section>

      <style>{`
        .login-grid {
          display: grid;
          grid-template-columns: 1fr;
          height: 100dvh;
        }
        .login-grid > section {
          overflow-y: auto;
        }
        @media (min-width: 720px) {
          .login-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
