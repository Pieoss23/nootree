"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  createTenantProduct,
  updateTenantProduct,
  setTenantProductStatus,
  countActiveTenantProducts,
  tenantProductFormSchema,
  type TenantProductWriteFields,
} from "@/modules/products";
import {
  assertFeature,
  assertWithinLimit,
  FeatureNotAvailableError,
  ResourceLimitExceededError,
} from "@/modules/entitlements";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

/** Stessa soglia usata per le scritture pazienti — vedi docs/audit/decisions.md. */
const MINIMUM_ROLE_FOR_PRODUCT_WRITES = "ASSISTANT" as const;

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof TenantProductWriteFields, string>>;
};

function parseForm(formData: FormData) {
  return tenantProductFormSchema.safeParse({
    name: formData.get("name"),
    kcalPer100g: formData.get("kcalPer100g"),
    proteinGPer100g: formData.get("proteinGPer100g"),
    carbsGPer100g: formData.get("carbsGPer100g"),
    fatGPer100g: formData.get("fatGPer100g"),
    fiberGPer100g: formData.get("fiberGPer100g"),
    notes: formData.get("notes"),
  });
}

function fieldErrorsFrom(
  error: ReturnType<typeof parseForm>["error"],
): ProductFormState["fieldErrors"] {
  if (!error) return undefined;
  const errors: ProductFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") errors[key as keyof TenantProductWriteFields] = issue.message;
  }
  return errors;
}

export async function createTenantProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
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
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PRODUCT_WRITES);
    await assertFeature(tenant.tenantId, "products.catalog");
    const activeProducts = await countActiveTenantProducts(tenant.tenantId);
    await assertWithinLimit(tenant.tenantId, "customProducts", activeProducts);

    const product = await createTenantProduct({ tenantId: tenant.tenantId, ...parsed.data });

    await recordAuditEvent({
      tenantId: tenant.tenantId,
      actorUserId: tenant.userId,
      action: "product.created",
      entityType: "tenant_product",
      entityId: product.id,
    });
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di creare prodotti." };
    }
    if (error instanceof ResourceLimitExceededError) {
      return {
        status: "error",
        message: `Limite prodotti personalizzati raggiunto (${error.current}/${error.limit}) per il piano attuale.`,
      };
    }
    if (error instanceof FeatureNotAvailableError) {
      return { status: "error", message: "Il catalogo prodotti non è incluso nel piano attuale." };
    }
    throw error;
  }

  revalidatePath("/app/products");
  return { status: "success", message: "Prodotto creato." };
}

export async function updateTenantProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return { status: "error", message: "Prodotto non valido." };
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
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PRODUCT_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare prodotti." };
    }
    throw error;
  }

  const product = await updateTenantProduct({
    tenantId: tenant.tenantId,
    productId,
    ...parsed.data,
  });
  if (!product) return { status: "error", message: "Prodotto non trovato." };

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "product.updated",
    entityType: "tenant_product",
    entityId: product.id,
  });

  revalidatePath("/app/products");
  return { status: "success", message: "Prodotto aggiornato." };
}

export async function setTenantProductStatusAction(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  const status = formData.get("status");
  if (typeof productId !== "string" || (status !== "ACTIVE" && status !== "ARCHIVED")) {
    throw new Error("Invalid setTenantProductStatusAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_PRODUCT_WRITES);

  const product = await setTenantProductStatus({ tenantId: tenant.tenantId, productId, status });
  if (!product) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: status === "ARCHIVED" ? "product.archived" : "product.reactivated",
    entityType: "tenant_product",
    entityId: product.id,
  });

  revalidatePath("/app/products");
}
