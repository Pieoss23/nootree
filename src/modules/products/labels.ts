import type { FoodCategory } from "./types";

const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  CEREALI_E_DERIVATI: "Cereali e derivati",
  VERDURA: "Verdura",
  FRUTTA: "Frutta",
  CARNE: "Carne",
  PESCE: "Pesce",
  LATTICINI_E_UOVA: "Latticini e uova",
  LEGUMI: "Legumi",
  GRASSI_E_OLI: "Grassi e oli",
  BEVANDE: "Bevande",
  DOLCI_E_SNACK: "Dolci e snack",
  ALTRO: "Altro",
};

export function getFoodCategoryLabel(category: FoodCategory): string {
  return FOOD_CATEGORY_LABELS[category];
}

export const FOOD_CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = (
  Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]
).map((value) => ({ value, label: FOOD_CATEGORY_LABELS[value] }));
