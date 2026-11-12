"use client";

import { createContext, useContext } from "react";
import type { PublicCatalog } from "@/lib/catalog";

const Ctx = createContext<PublicCatalog | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: PublicCatalog; children: React.ReactNode }) {
  return <Ctx.Provider value={catalog}>{children}</Ctx.Provider>;
}

export function useCatalog(): PublicCatalog {
  const cat = useContext(Ctx);
  if (!cat) throw new Error("Katalog yüklenemedi.");
  return cat;
}
