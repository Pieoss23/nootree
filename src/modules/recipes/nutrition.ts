export type IngredientNutritionInput = {
  quantityGrams: number;
  kcalPer100g: number;
  proteinGPer100g: number | null;
  carbsGPer100g: number | null;
  fatGPer100g: number | null;
  fiberGPer100g: number | null;
};

export type RecipeNutritionTotals = {
  totalGrams: number;
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  /** Densità della ricetta — usata per scalare la porzione consigliata su un paziente. */
  kcalPer100g: number;
};

/**
 * Pura (nessun accesso a DB): ogni valore "per 100g" è scalato per la
 * quantità in grammi dell'ingrediente e sommato. I macro nutrienti nulli
 * (possibili per i prodotti personalizzati, vedi `tenant_products`)
 * contribuiscono zero, non vengono trattati come dato mancante che blocca
 * il calcolo — a differenza del dosaggio consigliato per paziente
 * (`dosage.ts`), dove i dati mancanti bloccano esplicitamente la stima.
 */
export function computeRecipeNutrition(
  ingredients: IngredientNutritionInput[],
): RecipeNutritionTotals {
  const totals = ingredients.reduce(
    (acc, ingredient) => {
      const factor = ingredient.quantityGrams / 100;
      acc.totalGrams += ingredient.quantityGrams;
      acc.totalKcal += ingredient.kcalPer100g * factor;
      acc.totalProteinG += (ingredient.proteinGPer100g ?? 0) * factor;
      acc.totalCarbsG += (ingredient.carbsGPer100g ?? 0) * factor;
      acc.totalFatG += (ingredient.fatGPer100g ?? 0) * factor;
      acc.totalFiberG += (ingredient.fiberGPer100g ?? 0) * factor;
      return acc;
    },
    { totalGrams: 0, totalKcal: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0, totalFiberG: 0 },
  );

  return {
    ...totals,
    kcalPer100g: totals.totalGrams > 0 ? (totals.totalKcal / totals.totalGrams) * 100 : 0,
  };
}
