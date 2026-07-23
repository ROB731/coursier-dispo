"use client";

import { useState } from "react";
import { ApiError, uploaderPhoto } from "@/lib/apiClient";

export function PhotoUploadField({ valeurInitiale }: { valeurInitiale?: string }) {
  const [url, setUrl] = useState(valeurInitiale ?? "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur(null);
    setEnCours(true);
    try {
      const { url: nouvelleUrl } = await uploaderPhoto(fichier);
      setUrl(nouvelleUrl);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Échec du téléversement");
    } finally {
      setEnCours(false);
      e.target.value = "";
    }
  }

  return (
    <div className="form-field">
      <label htmlFor="photoInput">Photo *</label>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {url ? (
          <img
            src={url}
            alt=""
            style={{ width: "4.5rem", height: "4.5rem", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: "4.5rem",
              height: "4.5rem",
              borderRadius: "50%",
              background: "var(--color-border)",
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <input
            id="photoInput"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={onFileChange}
            disabled={enCours}
            style={{ padding: 0, border: "none", minHeight: "auto" }}
          />
          {enCours && <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0.35rem 0 0" }}>Téléversement…</p>}
          {erreur && <p className="form-error" style={{ marginTop: "0.35rem" }}>{erreur}</p>}
        </div>
      </div>
      <input type="hidden" name="photoUrl" value={url} />
    </div>
  );
}
