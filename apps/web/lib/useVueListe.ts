"use client";

import { useEffect, useState } from "react";

export type VueListe = "cartes" | "tableau";

const STORAGE_KEY = "dispo-coursier-vue-liste";

export function useVueListe() {
  const [vue, setVueState] = useState<VueListe>("cartes");

  useEffect(() => {
    const stocke = window.localStorage.getItem(STORAGE_KEY);
    if (stocke === "tableau" || stocke === "cartes") setVueState(stocke);
  }, []);

  function setVue(v: VueListe) {
    setVueState(v);
    window.localStorage.setItem(STORAGE_KEY, v);
  }

  return { vue, setVue };
}
