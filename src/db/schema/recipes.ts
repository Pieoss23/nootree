import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid, numeric, index, check } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";
import { patients } from "./patients";
import { foodItems, tenantProducts } from "./products";

export const recipeStatusEnum = pgEnum("recipe_status", ["ACTIVE", "ARCHIVED"]);

/** Ricette dello studio, composte da ingredienti — tenant-scoped, a differenza di `foodItems`. */
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    instructions: text("instructions"),
    status: recipeStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("recipes_tenant_id_idx").on(table.tenantId)],
);

/**
 * Una riga per ingrediente. L'ingrediente è o una voce del catalogo condiviso
 * (`foodItemId`) o un prodotto personalizzato del tenant (`tenantProductId`),
 * mai entrambi né nessuno dei due — vincolo imposto a livello DB (`check`),
 * non solo applicativo, perché non esiste un vero FK polimorfico in Postgres.
 * `quantityGrams` è sempre in grammi, coerente con i valori "per 100g" di
 * entrambe le fonti.
 */
export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    foodItemId: uuid("food_item_id").references(() => foodItems.id),
    tenantProductId: uuid("tenant_product_id").references(() => tenantProducts.id),
    quantityGrams: numeric("quantity_grams", { precision: 7, scale: 1, mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("recipe_ingredients_recipe_id_idx").on(table.recipeId),
    index("recipe_ingredients_tenant_id_idx").on(table.tenantId),
    check(
      "recipe_ingredients_single_source",
      sql`(${table.foodItemId} is not null) <> (${table.tenantProductId} is not null)`,
    ),
  ],
);

/**
 * Assegnazione di una ricetta a un paziente, con la porzione (grammi)
 * effettivamente indicata dal nutrizionista. `suggestedPortionGrams` è lo
 * snapshot di quanto calcolato da `src/modules/recipes/dosage.ts` al momento
 * dell'assegnazione (per tracciabilità), non un valore vincolante: il
 * nutrizionista può sempre modificarlo. Stesso pattern di
 * `patient_measurements`: aggiunta/eliminazione, non modifica in-place — vedi
 * docs/audit/decisions.md.
 */
export const patientRecipes = pgTable(
  "patient_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    portionGrams: numeric("portion_grams", { precision: 7, scale: 1, mode: "number" }).notNull(),
    suggestedPortionGrams: numeric("suggested_portion_grams", {
      precision: 7,
      scale: 1,
      mode: "number",
    }),
    notes: text("notes"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("patient_recipes_tenant_id_idx").on(table.tenantId),
    index("patient_recipes_patient_id_idx").on(table.patientId),
  ],
);
