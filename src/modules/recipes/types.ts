import type { recipes, recipeIngredients, patientRecipes } from "@/db/schema";

export type Recipe = typeof recipes.$inferSelect;
export type RecipeStatus = Recipe["status"];

export type RecipeIngredientRow = typeof recipeIngredients.$inferSelect;

/** Riga ingrediente unificata dopo il join con `foodItems`/`tenantProducts` — vedi repository.ts. */
export type RecipeIngredientWithNutrition = {
  id: string;
  recipeId: string;
  quantityGrams: number;
  source: "FOOD_ITEM" | "TENANT_PRODUCT";
  sourceId: string;
  name: string;
  kcalPer100g: number;
  proteinGPer100g: number | null;
  carbsGPer100g: number | null;
  fatGPer100g: number | null;
  fiberGPer100g: number | null;
};

/** Riepilogo di una ricetta (per l'elenco generale e per il selettore di assegnazione al paziente). */
export type RecipeSummary = {
  id: string;
  name: string;
  status: RecipeStatus;
  totalGrams: number;
  kcalPer100g: number;
};

export type PatientRecipe = typeof patientRecipes.$inferSelect;

/** Riga assegnazione unita al nome/stato della ricetta, per la tab del paziente. */
export type PatientRecipeWithRecipe = PatientRecipe & {
  recipeName: string;
  recipeStatus: RecipeStatus;
};
