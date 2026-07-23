"use client";

import { useEffect, useMemo, useState } from "react";

const TAILLE_PAGE = 20;

export function usePagination<T>(items: T[], tailleParPage: number = TAILLE_PAGE) {
  const [page, setPage] = useState(1);
  const nbPages = Math.max(1, Math.ceil(items.length / tailleParPage));

  useEffect(() => {
    if (page > nbPages) setPage(1);
  }, [nbPages, page]);

  const pageItems = useMemo(() => {
    const debut = (page - 1) * tailleParPage;
    return items.slice(debut, debut + tailleParPage);
  }, [items, page, tailleParPage]);

  return { page, setPage, nbPages, pageItems, decalage: (page - 1) * tailleParPage };
}
