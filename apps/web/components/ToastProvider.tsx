"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Variante = "succes" | "erreur";

interface ToastItem {
  id: number;
  message: string;
  variante: Variante;
}

interface ToastContextValue {
  showToast: (message: string, variante?: Variante) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DUREE_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prochainId = useRef(0);

  const showToast = useCallback((message: string, variante: Variante = "succes") => {
    const id = prochainId.current++;
    setToasts((liste) => [...liste, { id, message, variante }]);
    setTimeout(() => {
      setToasts((liste) => liste.filter((t) => t.id !== id));
    }, DUREE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          zIndex: 70,
          maxWidth: "calc(100vw - 2.5rem)",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              borderLeft: `3px solid ${t.variante === "succes" ? "var(--color-disponible)" : "var(--color-non-disponible)"}`,
              minWidth: 240,
            }}
          >
            <span aria-hidden="true" style={{ color: t.variante === "succes" ? "var(--color-disponible)" : "var(--color-non-disponible)" }}>
              {t.variante === "succes" ? "✓" : "✕"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>");
  return ctx;
}
