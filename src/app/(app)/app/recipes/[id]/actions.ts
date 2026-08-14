"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  addRecipeIngredient,
  removeRecipeIngredient,
  recipeIngredientFormSchema,
  type RecipeIngredientFormValues,
} from "@/modules/recipes";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

const MINIMUM_ROLE_FOR_RECIPE_WRITES = "ASSISTANT" as const;

export type RecipeIngredientFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof RecipeIngredientFormValues, string>>;
};

export async function addRecipeIngredientAction(
  _prevState: RecipeIngredientFormState,
  formData: FormData,
): Promise<RecipeIngredientFormState> {
  const recipeId = formData.get("recipeId");
  if (typeof recipeId !== "string" || !recipeId) {
    return { status: "error", message: "Ricetta non valida." };
  }

  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_RECIPE_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare ricette." };
    }
    throw error;
  }

  const parsed = recipeIngredientFormSchema.safeParse({
    ingredientRef: formData.get("ingredientRef"),
    quantityGrams: formData.get("quantityGrams"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Seleziona un ingrediente e una quantità valida." };
  }

  await addRecipeIngredient({ tenantId: tenant.tenantId, recipeId, ...parsed.data });

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "recipe.ingredient_added",
    entityType: "recipe",
    entityId: recipeId,
  });

  revalidatePath(`/app/recipes/${recipeId}`);
  return { status: "success", message: "Ingrediente aggiunto." };
}

export async function removeRecipeIngredientAction(formData: FormData): Promise<void> {
  const recipeId = formData.get("recipeId");
  const ingredientId = formData.get("ingredientId");
  if (typeof recipeId !== "string" || typeof ingredientId !== "string") {
    throw new Error("Invalid removeRecipeIngredientAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_RECIPE_WRITES);

  const removed = await removeRecipeIngredient({
    tenantId: tenant.tenantId,
    recipeId,
    ingredientId,
  });
  if (!removed) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "recipe.ingredient_removed",
    entityType: "recipe",
    entityId: recipeId,
  });

  revalidatePath(`/app/recipes/${recipeId}`);
}
