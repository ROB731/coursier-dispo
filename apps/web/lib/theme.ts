export type Theme = "light" | "dark";

const STORAGE_KEY = "dispo-coursier-theme";

export function getThemeStocke(): Theme {
  if (typeof window === "undefined") return "light";
  const stocke = window.localStorage.getItem(STORAGE_KEY);
  return stocke === "dark" ? "dark" : "light";
}

export function appliquerTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}
