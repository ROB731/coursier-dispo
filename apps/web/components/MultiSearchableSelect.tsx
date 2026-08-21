"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OptionSelect } from "./SearchableSelect";
import { IconCheck, IconX } from "@/components/icons";

export function MultiSearchableSelect({
  options,
  valeurs,
  onChange,
  placeholder = "Ajouter…",
  name,
}: {
  options: OptionSelect[];
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
  placeholder?: string;
  name?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const conteneurRef = useRef<HTMLDivElement>(null);

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

  const optionsAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, recherche]);

  const selections = valeurs.map((v) => options.find((o) => o.value === v)).filter((o): o is OptionSelect => Boolean(o));

  function ajouter(value: string) {
    onChange([...valeurs, value]);
    setRecherche("");
  }

  function retirer(value: string) {
    onChange(valeurs.filter((v) => v !== value));
  }

  // Un clic sur une suggestion bascule son état : l'ajoute si absente, la
  // retire directement si déjà sélectionnée — pas besoin de chercher le
  // petit bouton "×" sur l'étiquette pour enlever quelque chose déjà ajouté.
  function basculer(value: string) {
    if (valeurs.includes(value)) {
      retirer(value);
    } else {
      ajouter(value);
    }
  }

  return (
    <div ref={conteneurRef} style={{ position: "relative" }}>
      {name && valeurs.map((v) => <input key={v} type="hidden" name={name} value={v} />)}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          padding: "0.4rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          minHeight: "var(--touch-target)",
        }}
        onClick={() => setOuvert(true)}
      >
        {selections.map((o) => (
          <span
            key={o.value}
            className="badge badge-disponible"
            style={{ cursor: "default" }}
            onClick={(e) => e.stopPropagation()}
          >
            {o.label}
            <button
              type="button"
              onClick={() => retirer(o.value)}
              aria-label={`Retirer ${o.label}`}
              style={{ marginLeft: "0.2rem", display: "inline-flex" }}
            >
              <IconX size={13} />
            </button>
          </span>
        ))}
        <input
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          placeholder={selections.length === 0 ? placeholder : ""}
          style={{ border: "none", minHeight: "auto", flex: "1 1 8rem", padding: "0.2rem" }}
        />
      </div>

      {ouvert && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 0.3rem)",
            left: 0,
            right: 0,
            zIndex: 65,
            padding: "0.5rem",
            maxHeight: "14rem",
            overflowY: "auto",
          }}
        >
          {optionsAffichees.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", padding: "0.4rem" }}>Aucun résultat.</p>
          )}
          {optionsAffichees.map((o) => {
            const selectionne = valeurs.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => basculer(o.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  color: selectionne ? "var(--color-primary)" : undefined,
                  background: selectionne ? "var(--color-primary-soft)" : undefined,
                }}
              >
                {o.label}
                {selectionne && <IconCheck size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
