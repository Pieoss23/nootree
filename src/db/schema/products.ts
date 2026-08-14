import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";

export const foodCategoryEnum = pgEnum("food_category", [
  "CEREALI_E_DERIVATI",
  "VERDURA",
  "FRUTTA",
  "CARNE",
  "PESCE",
  "LATTICINI_E_UOVA",
  "LEGUMI",
  "GRASSI_E_OLI",
  "BEVANDE",
  "DOLCI_E_SNACK",
  "ALTRO",
]);

/**
 * Catalogo alimenti condiviso tra tutti i tenant (dati nutrizionali di
 * riferimento, non proprietà di uno studio): nessuna colonna `tenantId`, a
 * differenza di ogni altra tabella "business" dello schema. `source` traccia
 * la provenienza del dato — oggi solo un seed curato a mano (nessun import
 * bulk CREA/BDA disponibile, vedi docs/audit/decisions.md), in futuro
 * potrebbe includere un vero import ufficiale o un lookup Open Food Facts.
 * Valori nutrizionali sempre per 100g, per confrontabilità diretta tra righe.
 */
export const foodItems = pgTable(
  "food_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: foodCategoryEnum("category").notNull(),
    source: text("source").notNull().default("CURATED_SEED"),
    kcalPer100g: numeric("kcal_per_100g", { precision: 6, scale: 1, mode: "number" }).notNull(),
    proteinGPer100g: numeric("protein_g_per_100g", {
      precision: 5,
      scale: 1,
      mode: "number",
    }).notNull(),
    carbsGPer100g: numeric("carbs_g_per_100g", {
      precision: 5,
      scale: 1,
      mode: "number",
    }).notNull(),
    fatGPer100g: numeric("fat_g_per_100g", { precision: 5, scale: 1, mode: "number" }).notNull(),
    fiberGPer100g: numeric("fiber_g_per_100g", { precision: 5, scale: 1, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("food_items_name_unique").on(table.name),
    index("food_items_category_idx").on(table.category),
  ],
);

export const tenantProductStatusEnum = pgEnum("tenant_product_status", ["ACTIVE", "ARCHIVED"]);

/**
 * Prodotti/ricette creati dallo studio stesso (es. un piatto tipico della
 * cucina interna), distinti dal catalogo condiviso `foodItems`. Stessa forma
 * nutrizionale (per 100g) per restare confrontabili, ma scritti/letti sempre
 * con `tenantId` — vedi docs/security/tenant-isolation-rules.md.
 */
export const tenantProducts = pgTable(
  "tenant_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kcalPer100g: numeric("kcal_per_100g", { precision: 6, scale: 1, mode: "number" }).notNull(),
    proteinGPer100g: numeric("protein_g_per_100g", { precision: 5, scale: 1, mode: "number" }),
    carbsGPer100g: numeric("carbs_g_per_100g", { precision: 5, scale: 1, mode: "number" }),
    fatGPer100g: numeric("fat_g_per_100g", { precision: 5, scale: 1, mode: "number" }),
    fiberGPer100g: numeric("fiber_g_per_100g", { precision: 5, scale: 1, mode: "number" }),
    notes: text("notes"),
    status: tenantProductStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("tenant_products_tenant_id_idx").on(table.tenantId)],
);
