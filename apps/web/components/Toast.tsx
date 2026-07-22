export function Toast({ message, onUndo }: { message: string; onUndo?: () => void }) {
  return (
    <div
      role="status"
      className="card"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "0.9rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        zIndex: 60,
      }}
    >
      <span>✓ {message}</span>
      {onUndo && (
        <button type="button" className="btn-text" onClick={onUndo}>
          Annuler
        </button>
      )}
    </div>
  );
}
