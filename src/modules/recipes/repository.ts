import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes, recipeIngredients, patientRecipes, foodItems, tenantProducts } from "@/db/schema";
import { computeRecipeNutrition } from "./nutrition";
import type {
  Recipe,
  RecipeStatus,
  RecipeIngredientWithNutrition,
  RecipeSummary,
  PatientRecipe,
  PatientRecipeWithRecipe,
} from "./types";

/**
 * Ogni query sotto prende sempre `tenantId` esplicito e filtra per esso,
 * stessa regola di src/modules/patients/repository.ts — vedi
 * docs/security/tenant-isolation-rules.md. Le uniche eccezioni sono i join
 * verso `food_items` (catalogo condiviso, senza `tenantId` per definizione —
 * vedi src/modules/products/repository.ts).
 */

export async function listRecipesByTenant(input: { tenantId: string }): Promise<Recipe[]> {
  return db
    .select()
    .from(recipes)
    .where(eq(recipes.tenantId, input.tenantId))
    .orderBy(asc(recipes.name));
}

export async function getRecipeById(input: {
  tenantId: string;
  recipeId: string;
}): Promise<Recipe | null> {
  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.tenantId, input.tenantId), eq(recipes.id, input.recipeId)))
    .limit(1);

  return row ?? null;
}

export async function createRecipe(input: {
  tenantId: string;
  name: string;
  instructions: string | null;
}): Promise<Recipe> {
  const [row] = await db
    .insert(recipes)
    .values({ tenantId: input.tenantId, name: input.name, instructions: input.instructions })
    .returning();

  return row;
}

export async function updateRecipe(input: {
  tenantId: string;
  recipeId: string;
  name: string;
  instructions: string | null;
}): Promise<Recipe | null> {
  const [row] = await db
    .update(recipes)
    .set({ name: input.name, instructions: input.instructions, updatedAt: new Date() })
    .where(and(eq(recipes.tenantId, input.tenantId), eq(recipes.id, input.recipeId)))
    .returning();

  return row ?? null;
}

/** Ricette archiviate, mai cancellate fisicamente — stesso pattern di pazienti/prodotti. */
export async function setRecipeStatus(input: {
  tenantId: string;
  recipeId: string;
  status: RecipeStatus;
}): Promise<Recipe | null> {
  const [row] = await db
    .update(recipes)
    .set({
      status: input.status,
      archivedAt: input.status === "ARCHIVED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(recipes.tenantId, input.tenantId), eq(recipes.id, input.recipeId)))
    .returning();

  return row ?? null;
}

function toIngredientWithNutrition(row: {
  id: string;
  recipeId: string;
  quantityGrams: number;
  foodItemId: string | null;
  tenantProductId: string | null;
  foodItemName: string | null;
  foodItemKcal: number | null;
  foodItemProtein: number | null;
  foodItemCarbs: number | null;
  foodItemFat: number | null;
  foodItemFiber: number | null;
  tenantProductName: string | null;
  tenantProductKcal: number | null;
  tenantProductProtein: number | null;
  tenantProductCarbs: number | null;
  tenantProductFat: number | null;
  tenantProductFiber: number | null;
}): RecipeIngredientWithNutrition {
  const isFoodItem = row.foodItemId !== null;
  return {
    id: row.id,
    recipeId: row.recipeId,
    quantityGrams: row.quantityGrams,
    source: isFoodItem ? "FOOD_ITEM" : "TENANT_PRODUCT",
    sourceId: (isFoodItem ? row.foodItemId : row.tenantProductId)!,
    name: (isFoodItem ? row.foodItemName : row.tenantProductName)!,
    kcalPer100g: (isFoodItem ? row.foodItemKcal : row.tenantProductKcal)!,
    proteinGPer100g: isFoodItem ? row.foodItemProtein : row.tenantProductProtein,
    carbsGPer100g: isFoodItem ? row.foodItemCarbs : row.tenantProductCarbs,
    fatGPer100g: isFoodItem ? row.foodItemFat : row.tenantProductFat,
    fiberGPer100g: isFoodItem ? row.foodItemFiber : row.tenantProductFiber,
  };
}

export async function listRecipeIngredients(input: {
  tenantId: string;
  recipeId: string;
}): Promise<RecipeIngredientWithNutrition[]> {
  const rows = await db
    .select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      quantityGrams: recipeIngredients.quantityGrams,
      foodItemId: recipeIngredients.foodItemId,
      tenantProductId: recipeIngredients.tenantProductId,
      foodItemName: foodItems.name,
      foodItemKcal: foodItems.kcalPer100g,
      foodItemProtein: foodItems.proteinGPer100g,
      foodItemCarbs: foodItems.carbsGPer100g,
      foodItemFat: foodItems.fatGPer100g,
      foodItemFiber: foodItems.fiberGPer100g,
      tenantProductName: tenantProducts.name,
      tenantProductKcal: tenantProducts.kcalPer100g,
      tenantProductProtein: tenantProducts.proteinGPer100g,
      tenantProductCarbs: tenantProducts.carbsGPer100g,
      tenantProductFat: tenantProducts.fatGPer100g,
      tenantProductFiber: tenantProducts.fiberGPer100g,
    })
    .from(recipeIngredients)
    .leftJoin(foodItems, eq(recipeIngredients.foodItemId, foodItems.id))
    .leftJoin(tenantProducts, eq(recipeIngredients.tenantProductId, tenantProducts.id))
    .where(
      and(
        eq(recipeIngredients.tenantId, input.tenantId),
        eq(recipeIngredients.recipeId, input.recipeId),
      ),
    )
    .orderBy(asc(recipeIngredients.createdAt));

  return rows.map(toIngredientWithNutrition);
}

export async function addRecipeIngredient(input: {
  tenantId: string;
  recipeId: string;
  foodItemId: string | null;
  tenantProductId: string | null;
  quantityGrams: number;
}): Promise<void> {
  await db.insert(recipeIngredients).values({
    tenantId: input.tenantId,
    recipeId: input.recipeId,
    foodItemId: input.foodItemId,
    tenantProductId: input.tenantProductId,
    quantityGrams: input.quantityGrams,
  });
}

export async function removeRecipeIngredient(input: {
  tenantId: string;
  recipeId: string;
  ingredientId: string;
}): Promise<boolean> {
  const rows = await db
    .delete(recipeIngredients)
    .where(
      and(
        eq(recipeIngredients.tenantId, input.tenantId),
        eq(recipeIngredients.recipeId, input.recipeId),
        eq(recipeIngredients.id, input.ingredientId),
      ),
    )
    .returning({ id: recipeIngredients.id });

  return rows.length > 0;
}

/**
 * Riepiloghi delle sole ricette attive, con densità calorica calcolata —
 * usati dal selettore "assegna ricetta" nella pagina paziente. N+1 query
 * (una per ricetta) accettabile alla scala attesa (poche ricette per
 * studio), stesso approccio già usato per il catalogo alimenti.
 */
export async function listActiveRecipeSummariesByTenant(input: {
  tenantId: string;
}): Promise<RecipeSummary[]> {
  const activeRecipes = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.tenantId, input.tenantId), eq(recipes.status, "ACTIVE")))
    .orderBy(asc(recipes.name));

  const summaries: RecipeSummary[] = [];
  for (const recipe of activeRecipes) {
    const ingredients = await listRecipeIngredients({
      tenantId: input.tenantId,
      recipeId: recipe.id,
    });
    const nutrition = computeRecipeNutrition(ingredients);
    summaries.push({
      id: recipe.id,
      name: recipe.name,
      status: recipe.status,
      totalGrams: nutrition.totalGrams,
      kcalPer100g: nutrition.kcalPer100g,
    });
  }
  return summaries;
}

export async function listPatientRecipes(input: {
  tenantId: string;
  patientId: string;
}): Promise<PatientRecipeWithRecipe[]> {
  const rows = await db
    .select({
      id: patientRecipes.id,
      tenantId: patientRecipes.tenantId,
      patientId: patientRecipes.patientId,
      recipeId: patientRecipes.recipeId,
      portionGrams: patientRecipes.portionGrams,
      suggestedPortionGrams: patientRecipes.suggestedPortionGrams,
      notes: patientRecipes.notes,
      assignedAt: patientRecipes.assignedAt,
      recipeName: recipes.name,
      recipeStatus: recipes.status,
    })
    .from(patientRecipes)
    .innerJoin(recipes, eq(patientRecipes.recipeId, recipes.id))
    .where(
      and(
        eq(patientRecipes.tenantId, input.tenantId),
        eq(patientRecipes.patientId, input.patientId),
      ),
    )
    .orderBy(asc(patientRecipes.assignedAt));

  return rows;
}

export async function createPatientRecipe(input: {
  tenantId: string;
  patientId: string;
  recipeId: string;
  portionGrams: number;
  suggestedPortionGrams: number | null;
  notes: string | null;
}): Promise<PatientRecipe> {
  const [row] = await db
    .insert(patientRecipes)
    .values({
      tenantId: input.tenantId,
      patientId: input.patientId,
      recipeId: input.recipeId,
      portionGrams: input.portionGrams,
      suggestedPortionGrams: input.suggestedPortionGrams,
      notes: input.notes,
    })
    .returning();

  return row;
}

/** Assegnazione rimossa, non archiviata: è un elenco di piano, non un'anagrafica — stesso ragionamento delle misurazioni. */
export async function deletePatientRecipe(input: {
  tenantId: string;
  patientId: string;
  patientRecipeId: string;
}): Promise<boolean> {
  const rows = await db
    .delete(patientRecipes)
    .where(
      and(
        eq(patientRecipes.tenantId, input.tenantId),
        eq(patientRecipes.patientId, input.patientId),
        eq(patientRecipes.id, input.patientRecipeId),
      ),
    )
    .returning({ id: patientRecipes.id });

  return rows.length > 0;
}
