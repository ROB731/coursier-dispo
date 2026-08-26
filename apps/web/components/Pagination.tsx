"use client";

import { IconArrowLeft, IconArrowRight } from "@/components/icons";

export function Pagination({ page, nbPages, onChange }: { page: number; nbPages: number; onChange: (page: number) => void }) {
  if (nbPages <= 1) return null;

  return (
    <div className="pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "1rem" }}>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <IconArrowLeft size={15} /> Précédent
      </button>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        Page {page} / {nbPages}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page >= nbPages}
        onClick={() => onChange(page + 1)}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        Suivant <IconArrowRight size={15} />
      </button>
    </div>
  );
}
