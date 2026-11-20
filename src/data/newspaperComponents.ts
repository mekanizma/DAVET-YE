import catalog from "@/data/newspaper-components.json";

export type NewspaperComponentKind = "icon" | "shape" | "line" | "text" | "image";

export type NewspaperComponentCategory = {
  id: string;
  label: string;
  labelEn: string;
};

export type NewspaperComponentItem = {
  id: string;
  kind: NewspaperComponentKind;
  category: string;
  label: string;
  labelEn: string;
  tags: string[];
  preview: string;
  defaults: Record<string, string | number | boolean | undefined>;
};

type Catalog = {
  version: number;
  categories: NewspaperComponentCategory[];
  items: NewspaperComponentItem[];
};

const data = catalog as Catalog;

export const NEWSPAPER_COMPONENT_CATEGORIES = data.categories;
export const NEWSPAPER_COMPONENTS = data.items;

export function searchNewspaperComponents(query: string, category = "all") {
  const q = query.trim().toLocaleLowerCase("tr");
  return NEWSPAPER_COMPONENTS.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    const hay = [item.label, item.labelEn, item.id, item.kind, item.category, ...(item.tags || [])]
      .join(" ")
      .toLocaleLowerCase("tr");
    return hay.includes(q);
  });
}

export function getNewspaperComponent(id: string) {
  return NEWSPAPER_COMPONENTS.find((item) => item.id === id);
}
