"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  createRecipe,
  updateRecipe,
  setRecipeStatus,
  recipeFormSchema,
  type RecipeFormValues,
} from "@/modules/recipes";
import { assertFeature, FeatureNotAvailableError } from "@/modules/entitlements";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

/** Stessa soglia usata per pazienti e prodotti — vedi docs/audit/decisions.md. */
const MINIMUM_ROLE_FOR_RECIPE_WRITES = "ASSISTANT" as const;

export type RecipeFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof RecipeFormValues, string>>;
};

function parseForm(formData: FormData) {
  return recipeFormSchema.safeParse({
    name: formData.get("name"),
    instructions: formData.get("instructions"),
  });
}

function fieldErrorsFrom(
  error: ReturnType<typeof parseForm>["error"],
): RecipeFormState["fieldErrors"] {
  if (!error) return undefined;
  const errors: RecipeFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") errors[key as keyof RecipeFormValues] = issue.message;
  }
  return errors;
}

export async function createRecipeAction(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_RECIPE_WRITES);
    await assertFeature(tenant.tenantId, "recipes.management");

    const recipe = await createRecipe({ tenantId: tenant.tenantId, ...parsed.data });

    await recordAuditEvent({
      tenantId: tenant.tenantId,
      actorUserId: tenant.userId,
      action: "recipe.created",
      entityType: "recipe",
      entityId: recipe.id,
    });
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di creare ricette." };
    }
    if (error instanceof FeatureNotAvailableError) {
      return { status: "error", message: "La gestione ricette non è inclusa nel piano attuale." };
    }
    throw error;
  }

  revalidatePath("/app/recipes");
  return { status: "success", message: "Ricetta creata." };
}

export async function updateRecipeAction(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const recipeId = formData.get("recipeId");
  if (typeof recipeId !== "string" || !recipeId) {
    return { status: "error", message: "Ricetta non valida." };
  }

  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_RECIPE_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare ricette." };
    }
    throw error;
  }

  const recipe = await updateRecipe({ tenantId: tenant.tenantId, recipeId, ...parsed.data });
  if (!recipe) return { status: "error", message: "Ricetta non trovata." };

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "recipe.updated",
    entityType: "recipe",
    entityId: recipe.id,
  });

  revalidatePath("/app/recipes");
  revalidatePath(`/app/recipes/${recipeId}`);
  return { status: "success", message: "Ricetta aggiornata." };
}

export async function setRecipeStatusAction(formData: FormData): Promise<void> {
  const recipeId = formData.get("recipeId");
  const status = formData.get("status");
  if (typeof recipeId !== "string" || (status !== "ACTIVE" && status !== "ARCHIVED")) {
    throw new Error("Invalid setRecipeStatusAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_RECIPE_WRITES);

  const recipe = await setRecipeStatus({ tenantId: tenant.tenantId, recipeId, status });
  if (!recipe) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: status === "ARCHIVED" ? "recipe.archived" : "recipe.reactivated",
    entityType: "recipe",
    entityId: recipe.id,
  });

  revalidatePath("/app/recipes");
  revalidatePath(`/app/recipes/${recipeId}`);
}
