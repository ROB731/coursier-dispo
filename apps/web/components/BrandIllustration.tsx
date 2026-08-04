// Un bâtiment (le siège), pas un repère de position — l'app répond à "qui est
// au siège", pas "où se trouve-t-il". Le badge en bas à droite représente la
// présence suivie en temps réel.
export function BrandIllustration() {
  return (
    <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: "17.5rem" }}>
      <circle cx="160" cy="160" r="150" fill="rgba(255,255,255,0.08)" />
      <circle cx="160" cy="160" r="110" fill="rgba(255,255,255,0.08)" />
      <circle cx="160" cy="160" r="64" fill="rgba(255,255,255,0.16)" />

      {/* Bâtiment */}
      <rect x="113" y="88" width="94" height="146" rx="8" fill="#ffffff" />

      {/* Fenêtres */}
      <rect x="130" y="106" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="152" y="106" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="174" y="106" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="130" y="130" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="152" y="130" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="174" y="130" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="130" y="154" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="152" y="154" width="16" height="16" rx="3" fill="var(--color-primary)" />
      <rect x="174" y="154" width="16" height="16" rx="3" fill="var(--color-primary)" />

      {/* Porte d'entrée */}
      <rect x="145" y="196" width="30" height="38" rx="4" fill="var(--color-primary)" />

      {/* Badge de présence (suivi en temps réel) */}
      <circle cx="203" cy="212" r="19" fill="var(--color-accent)" stroke="var(--color-primary-hover)" strokeWidth="3" />
      <path
        d="M195 212.5 200.5 218 211 205.5"
        stroke="var(--color-accent-contrast)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <circle cx="252" cy="210" r="5" fill="var(--color-accent)" opacity="0.85" />
      <circle cx="80" cy="228" r="6" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}
