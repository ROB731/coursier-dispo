import type { Metadata } from "next";

export function generateMetadata({ params }: { params: { terminalId: string } }): Metadata {
  return {
    manifest: `/borne/${params.terminalId}/manifest.webmanifest`,
  };
}

export default function BorneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
