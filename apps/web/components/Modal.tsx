"use client";

export function Modal({
  titre,
  onClose,
  children,
  maxWidth = "26.25rem",
}: {
  titre: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 55,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: "1.5rem",
          maxWidth,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>{titre}</h2>
          <button type="button" className="btn-text" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
