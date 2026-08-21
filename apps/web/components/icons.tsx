// Icônes SVG traits (style Feather/Lucide) — jamais d'emoji dans l'UI.
// Toutes héritent de la couleur du texte (stroke="currentColor") et acceptent
// size + les props SVG standard (className, style, aria-hidden…).

import type { SVGProps } from "react";

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  const { size = 18, ...reste } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...reste,
  };
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.25" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.25" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.25" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.25" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8.5 12.5 11 15 15.5 9.5" />
    </svg>
  );
}

export function IconBan(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="9" cy="7.5" r="3.25" />
      <path d="M18.5 19v-1.5a3.4 3.4 0 0 0-2.2-3.2" />
      <path d="M15 4.3a3.25 3.25 0 0 1 0 6.3" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.75 6.75 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.25" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="4.5" y1="4.5" x2="6.2" y2="6.2" />
      <line x1="17.8" y1="17.8" x2="19.5" y2="19.5" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="4.5" y1="19.5" x2="6.2" y2="17.8" />
      <line x1="17.8" y1="6.2" x2="19.5" y2="4.5" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5a2 2 0 0 1 2-2h1.2l1-1.6a2 2 0 0 1 1.7-.9h4.2a2 2 0 0 1 1.7.9l1 1.6H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  );
}

export function IconZoom(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="5.8" />
      <line x1="15.2" y1="15.2" x2="20" y2="20" />
      <line x1="10.8" y1="8.3" x2="10.8" y2="13.3" />
      <line x1="8.3" y1="10.8" x2="13.3" y2="10.8" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
      <polyline points="20 3.5 20 8.5 15 8.5" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
      <polyline points="4 20.5 4 15.5 9 15.5" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
      <path d="M10.3 19a1.8 1.8 0 0 0 3.4 0" />
    </svg>
  );
}
