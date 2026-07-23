"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface OptionSelect {
  value: string;
  label: string;
  sousLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Rechercher…",
  name,
  required,
  disabled,
}: {
  options: OptionSelect[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const conteneurRef = useRef<HTMLDivElement>(null);

  const selection = options.find((o) => o.value === value);

  useEffect(() => {
    function onClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
        setRecherche("");
      }
    }
    document.addEventListener("mousedown", onClicExterieur);
    return () => document.removeEventListener("mousedown", onClicExterieur);
  }, []);

  const optionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sousLabel?.toLowerCase().includes(q));
  }, [options, recherche]);

  return (
    <div ref={conteneurRef} style={{ position: "relative" }}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOuvert((v) => !v)}
        style={{
          width: "100%",
          minHeight: "var(--touch-target)",
          padding: "0.6rem 0.85rem",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          color: selection ? "var(--color-text)" : "var(--color-text-muted)",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selection ? selection.label : placeholder}
        </span>
        <span aria-hidden="true" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
          ▾
        </span>
      </button>

      {ouvert && !disabled && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 0.3rem)",
            left: 0,
            right: 0,
            zIndex: 65,
            padding: "0.5rem",
            maxHeight: "16rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Taper pour rechercher…"
            style={{ marginBottom: "0.4rem" }}
          />
          <div style={{ overflowY: "auto" }}>
            {optionsFiltrees.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", padding: "0.4rem" }}>Aucun résultat.</p>
            )}
            {optionsFiltrees.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOuvert(false);
                  setRecherche("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  background: o.value === value ? "var(--color-primary-soft)" : "transparent",
                  color: o.value === value ? "var(--color-primary)" : "var(--color-text)",
                }}
              >
                {o.label}
                {o.sousLabel && (
                  <span style={{ color: "var(--color-text-muted)", marginLeft: "0.4rem", fontSize: "0.85rem" }}>
                    {o.sousLabel}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
