import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { foodItems, tenantProducts } from "@/db/schema";
import type { FoodItem, TenantProduct, TenantProductStatus } from "./types";

/**
 * `foodItems` è un catalogo condiviso (nessun `tenantId`, vedi
 * src/db/schema/products.ts): a differenza di ogni altra query di questo
 * codebase, qui non c'è isolamento per tenant da applicare — è dato di
 * riferimento, non di un singolo studio. Il catalogo è piccolo (seed curato,
 * non un import bulk — vedi docs/audit/decisions.md), quindi la ricerca
 * avviene lato client sull'elenco completo, come per `PatientsTable`.
 */
export async function listFoodItems(input?: { limit?: number }): Promise<FoodItem[]> {
  return db
    .select()
    .from(foodItems)
    .orderBy(asc(foodItems.name))
    .limit(input?.limit ?? 500);
}

/**
 * Ogni query sotto invece prende sempre `tenantId` esplicito e filtra per
 * esso, stessa regola di src/modules/patients/repository.ts — vedi
 * docs/security/tenant-isolation-rules.md.
 */

export async function listTenantProducts(input: { tenantId: string }): Promise<TenantProduct[]> {
  return db
    .select()
    .from(tenantProducts)
    .where(eq(tenantProducts.tenantId, input.tenantId))
    .orderBy(asc(tenantProducts.name));
}

export async function getTenantProductById(input: {
  tenantId: string;
  productId: string;
}): Promise<TenantProduct | null> {
  const [row] = await db
    .select()
    .from(tenantProducts)
    .where(and(eq(tenantProducts.tenantId, input.tenantId), eq(tenantProducts.id, input.productId)))
    .limit(1);

  return row ?? null;
}

export async function countActiveTenantProducts(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tenantProducts)
    .where(and(eq(tenantProducts.tenantId, tenantId), eq(tenantProducts.status, "ACTIVE")));

  return row?.value ?? 0;
}

export type TenantProductWriteFields = {
  name: string;
  kcalPer100g: number;
  proteinGPer100g: number | null;
  carbsGPer100g: number | null;
  fatGPer100g: number | null;
  fiberGPer100g: number | null;
  notes: string | null;
};

export async function createTenantProduct(
  input: { tenantId: string } & TenantProductWriteFields,
): Promise<TenantProduct> {
  const [row] = await db
    .insert(tenantProducts)
    .values({
      tenantId: input.tenantId,
      name: input.name,
      kcalPer100g: input.kcalPer100g,
      proteinGPer100g: input.proteinGPer100g,
      carbsGPer100g: input.carbsGPer100g,
      fatGPer100g: input.fatGPer100g,
      fiberGPer100g: input.fiberGPer100g,
      notes: input.notes,
    })
    .returning();

  return row;
}

export async function updateTenantProduct(
  input: { tenantId: string; productId: string } & TenantProductWriteFields,
): Promise<TenantProduct | null> {
  const [row] = await db
    .update(tenantProducts)
    .set({
      name: input.name,
      kcalPer100g: input.kcalPer100g,
      proteinGPer100g: input.proteinGPer100g,
      carbsGPer100g: input.carbsGPer100g,
      fatGPer100g: input.fatGPer100g,
      fiberGPer100g: input.fiberGPer100g,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(tenantProducts.tenantId, input.tenantId), eq(tenantProducts.id, input.productId)))
    .returning();

  return row ?? null;
}

/** Prodotti archiviati, mai cancellati fisicamente — stesso pattern di setPatientStatus. */
export async function setTenantProductStatus(input: {
  tenantId: string;
  productId: string;
  status: TenantProductStatus;
}): Promise<TenantProduct | null> {
  const [row] = await db
    .update(tenantProducts)
    .set({
      status: input.status,
      archivedAt: input.status === "ARCHIVED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tenantProducts.tenantId, input.tenantId), eq(tenantProducts.id, input.productId)))
    .returning();

  return row ?? null;
}
