"use client";

import { useEffect, useState } from "react";
import { appliquerTheme, getThemeStocke, Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getThemeStocke());
  }, []);

  function basculer() {
    const nouveau: Theme = theme === "light" ? "dark" : "light";
    setTheme(nouveau);
    appliquerTheme(nouveau);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="btn-text"
      aria-label={theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"}
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
