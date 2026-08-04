"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, uploaderPhoto } from "@/lib/apiClient";
import { IconCamera, IconCheck } from "@/components/icons";

const REGEX_HEIC = /\.hei[cf]$/i;

function estHeic(fichier: File): boolean {
  return fichier.type === "image/heic" || fichier.type === "image/heif" || REGEX_HEIC.test(fichier.name);
}

// Les photos iPhone (caméra ou galerie) sont souvent en HEIC — format que ni
// le serveur ni la plupart des navigateurs (hors Safari) ne savent afficher.
// On convertit en JPEG directement dans le navigateur avant l'envoi.
async function versFichierEnvoyable(fichier: File): Promise<File> {
  if (!estHeic(fichier)) return fichier;
  const heic2any = (await import("heic2any")).default;
  const resultat = await heic2any({ blob: fichier, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(resultat) ? resultat[0] : resultat;
  return new File([blob], fichier.name.replace(REGEX_HEIC, ".jpg"), { type: "image/jpeg" });
}

export function PhotoUploadField({ valeurInitiale }: { valeurInitiale?: string }) {
  const [url, setUrl] = useState(valeurInitiale ?? "");
  const [apercu, setApercu] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survole, setSurvole] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlObjetRef = useRef<string | null>(null);

  // L'aperçu local (URL.createObjectURL) est instantané et indépendant du
  // réseau — plus de vignette qui reste vide pendant le téléversement, ni qui
  // "disparaît" si l'image distante tarde ou échoue à charger.
  useEffect(() => {
    return () => {
      if (urlObjetRef.current) URL.revokeObjectURL(urlObjetRef.current);
    };
  }, []);

  async function traiterFichier(fichier: File) {
    setErreur(null);

    if (urlObjetRef.current) URL.revokeObjectURL(urlObjetRef.current);
    const previewLocal = URL.createObjectURL(fichier);
    urlObjetRef.current = previewLocal;
    setApercu(previewLocal);

    setEnCours(true);
    try {
      const fichierEnvoyable = await versFichierEnvoyable(fichier);
      const { url: nouvelleUrl } = await uploaderPhoto(fichierEnvoyable);
      setUrl(nouvelleUrl);
    } catch (err) {
      setErreur(
        err instanceof ApiError
          ? err.message
          : "Échec du téléversement — essayez une autre photo (idéalement en JPG ou PNG)"
      );
    } finally {
      setEnCours(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (fichier) traiterFichier(fichier);
  }

  function onDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setSurvole(false);
    const fichier = e.dataTransfer.files?.[0];
    if (fichier) traiterFichier(fichier);
  }

  const image = apercu ?? url;

  return (
    <div className="form-field">
      <label>Photo *</label>
      <div className="photo-upload">
        <button
          type="button"
          className={`photo-upload-avatar ${survole ? "survole" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvole(true);
          }}
          onDragLeave={() => setSurvole(false)}
          onDrop={onDrop}
          aria-label={image ? "Changer la photo" : "Ajouter une photo"}
        >
          {image ? (
            <img src={image} alt="" />
          ) : (
            <IconCamera size={24} style={{ color: "var(--color-text-muted)" }} />
          )}
          {enCours && (
            <span className="photo-upload-overlay">
              <span className="photo-upload-spinner" aria-hidden="true" />
            </span>
          )}
        </button>

        <div style={{ minWidth: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()} disabled={enCours}>
            {image ? "Changer la photo" : "Ajouter une photo"}
          </button>
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.4rem 0 0" }}>
            Glissez-déposez une image, ou cliquez pour parcourir.
          </p>
          {!enCours && !erreur && url && (
            <p style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", color: "var(--color-disponible)", margin: "0.35rem 0 0" }}>
              <IconCheck size={14} /> Photo enregistrée
            </p>
          )}
          {erreur && (
            <p className="form-error" style={{ marginTop: "0.35rem" }}>
              {erreur}
            </p>
          )}
        </div>

        <input ref={inputRef} id="photoInput" type="file" accept="image/*" onChange={onFileChange} disabled={enCours} hidden />
      </div>
      <input type="hidden" name="photoUrl" value={url} />
    </div>
  );
}
