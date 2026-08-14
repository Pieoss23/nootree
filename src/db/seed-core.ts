import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { PLAN_DEFINITIONS, FEATURE_DEFINITIONS, type FeatureKey } from "@/config/plans";

/**
 * Idempotent development seed, extracted from the CLI entrypoint (`seed.ts`)
 * so both `pnpm db:seed` and the DB integration tests exercise the exact
 * same logic. Every insert is keyed on a natural unique value (slug, email,
 * key, ...) and uses `onConflictDoUpdate`/`onConflictDoNothing`, so running
 * it twice never creates duplicates.
 */

export const DEMO_TENANT_SLUG = "demo-studio";
export const DEMO_OWNER_EMAIL = "owner@demo.nootree.dev";

export type SeedResult = {
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  planName: string;
};

/**
 * Catalogo alimenti condiviso — valori nutrizionali comuni/rappresentativi
 * per 100g, non la tabella ufficiale CREA/BDA verbatim (che non ha un import
 * bulk scaricabile, vedi docs/audit/decisions.md). Da sostituire/estendere
 * con un vero import quando un dataset strutturato sarà disponibile.
 */
const FOOD_ITEMS_SEED: {
  name: string;
  category: (typeof schema.foodItems.$inferInsert)["category"];
  kcalPer100g: number;
  proteinGPer100g: number;
  carbsGPer100g: number;
  fatGPer100g: number;
  fiberGPer100g: number | null;
}[] = [
  // Cereali e derivati
  {
    name: "Pasta di semola (secca)",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 358,
    proteinGPer100g: 12.5,
    carbsGPer100g: 71.2,
    fatGPer100g: 1.4,
    fiberGPer100g: 3.0,
  },
  {
    name: "Riso brillato",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 332,
    proteinGPer100g: 6.7,
    carbsGPer100g: 80.4,
    fatGPer100g: 0.6,
    fiberGPer100g: 1.0,
  },
  {
    name: "Pane comune",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 275,
    proteinGPer100g: 8.9,
    carbsGPer100g: 56.1,
    fatGPer100g: 1.2,
    fiberGPer100g: 3.0,
  },
  {
    name: "Farina di frumento tipo 00",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 340,
    proteinGPer100g: 11.0,
    carbsGPer100g: 74.0,
    fatGPer100g: 1.0,
    fiberGPer100g: 2.2,
  },
  {
    name: "Fiocchi d'avena",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 372,
    proteinGPer100g: 13.5,
    carbsGPer100g: 59.0,
    fatGPer100g: 7.0,
    fiberGPer100g: 10.0,
  },
  {
    name: "Orzo perlato",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 350,
    proteinGPer100g: 10.4,
    carbsGPer100g: 73.5,
    fatGPer100g: 1.6,
    fiberGPer100g: 8.0,
  },
  {
    name: "Farro",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 335,
    proteinGPer100g: 13.0,
    carbsGPer100g: 67.0,
    fatGPer100g: 2.5,
    fiberGPer100g: 8.0,
  },
  {
    name: "Grissini",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 431,
    proteinGPer100g: 11.0,
    carbsGPer100g: 73.0,
    fatGPer100g: 10.0,
    fiberGPer100g: 3.0,
  },
  {
    name: "Fette biscottate",
    category: "CEREALI_E_DERIVATI",
    kcalPer100g: 408,
    proteinGPer100g: 10.5,
    carbsGPer100g: 76.0,
    fatGPer100g: 6.5,
    fiberGPer100g: 3.5,
  },
  // Verdura
  {
    name: "Zucchine",
    category: "VERDURA",
    kcalPer100g: 15,
    proteinGPer100g: 1.3,
    carbsGPer100g: 1.8,
    fatGPer100g: 0.2,
    fiberGPer100g: 1.2,
  },
  {
    name: "Pomodori",
    category: "VERDURA",
    kcalPer100g: 19,
    proteinGPer100g: 1.0,
    carbsGPer100g: 3.5,
    fatGPer100g: 0.2,
    fiberGPer100g: 1.2,
  },
  {
    name: "Insalata (lattuga)",
    category: "VERDURA",
    kcalPer100g: 15,
    proteinGPer100g: 1.4,
    carbsGPer100g: 2.2,
    fatGPer100g: 0.2,
    fiberGPer100g: 1.5,
  },
  {
    name: "Spinaci",
    category: "VERDURA",
    kcalPer100g: 23,
    proteinGPer100g: 2.9,
    carbsGPer100g: 1.4,
    fatGPer100g: 0.4,
    fiberGPer100g: 2.2,
  },
  {
    name: "Carote",
    category: "VERDURA",
    kcalPer100g: 35,
    proteinGPer100g: 1.1,
    carbsGPer100g: 7.6,
    fatGPer100g: 0.2,
    fiberGPer100g: 3.1,
  },
  {
    name: "Broccoli",
    category: "VERDURA",
    kcalPer100g: 27,
    proteinGPer100g: 3.0,
    carbsGPer100g: 2.5,
    fatGPer100g: 0.4,
    fiberGPer100g: 3.0,
  },
  {
    name: "Melanzane",
    category: "VERDURA",
    kcalPer100g: 18,
    proteinGPer100g: 1.1,
    carbsGPer100g: 2.6,
    fatGPer100g: 0.2,
    fiberGPer100g: 2.6,
  },
  {
    name: "Peperoni",
    category: "VERDURA",
    kcalPer100g: 22,
    proteinGPer100g: 1.0,
    carbsGPer100g: 4.2,
    fatGPer100g: 0.3,
    fiberGPer100g: 1.9,
  },
  {
    name: "Cipolle",
    category: "VERDURA",
    kcalPer100g: 26,
    proteinGPer100g: 1.1,
    carbsGPer100g: 5.7,
    fatGPer100g: 0.1,
    fiberGPer100g: 1.3,
  },
  {
    name: "Patate",
    category: "VERDURA",
    kcalPer100g: 77,
    proteinGPer100g: 2.0,
    carbsGPer100g: 17.0,
    fatGPer100g: 0.1,
    fiberGPer100g: 1.6,
  },
  // Frutta
  {
    name: "Mele",
    category: "FRUTTA",
    kcalPer100g: 52,
    proteinGPer100g: 0.3,
    carbsGPer100g: 13.8,
    fatGPer100g: 0.2,
    fiberGPer100g: 2.4,
  },
  {
    name: "Banane",
    category: "FRUTTA",
    kcalPer100g: 89,
    proteinGPer100g: 1.1,
    carbsGPer100g: 22.8,
    fatGPer100g: 0.3,
    fiberGPer100g: 2.6,
  },
  {
    name: "Arance",
    category: "FRUTTA",
    kcalPer100g: 47,
    proteinGPer100g: 0.9,
    carbsGPer100g: 11.8,
    fatGPer100g: 0.1,
    fiberGPer100g: 2.4,
  },
  {
    name: "Pere",
    category: "FRUTTA",
    kcalPer100g: 57,
    proteinGPer100g: 0.4,
    carbsGPer100g: 15.2,
    fatGPer100g: 0.1,
    fiberGPer100g: 3.1,
  },
  {
    name: "Fragole",
    category: "FRUTTA",
    kcalPer100g: 32,
    proteinGPer100g: 0.7,
    carbsGPer100g: 7.7,
    fatGPer100g: 0.3,
    fiberGPer100g: 2.0,
  },
  {
    name: "Uva",
    category: "FRUTTA",
    kcalPer100g: 69,
    proteinGPer100g: 0.6,
    carbsGPer100g: 18.1,
    fatGPer100g: 0.2,
    fiberGPer100g: 0.9,
  },
  {
    name: "Kiwi",
    category: "FRUTTA",
    kcalPer100g: 61,
    proteinGPer100g: 1.1,
    carbsGPer100g: 14.7,
    fatGPer100g: 0.5,
    fiberGPer100g: 3.0,
  },
  {
    name: "Ananas",
    category: "FRUTTA",
    kcalPer100g: 50,
    proteinGPer100g: 0.5,
    carbsGPer100g: 13.1,
    fatGPer100g: 0.1,
    fiberGPer100g: 1.4,
  },
  // Carne
  {
    name: "Petto di pollo",
    category: "CARNE",
    kcalPer100g: 165,
    proteinGPer100g: 31.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 3.6,
    fiberGPer100g: 0,
  },
  {
    name: "Fesa di tacchino",
    category: "CARNE",
    kcalPer100g: 135,
    proteinGPer100g: 29.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 1.0,
    fiberGPer100g: 0,
  },
  {
    name: "Manzo magro",
    category: "CARNE",
    kcalPer100g: 158,
    proteinGPer100g: 26.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 6.0,
    fiberGPer100g: 0,
  },
  {
    name: "Vitello",
    category: "CARNE",
    kcalPer100g: 135,
    proteinGPer100g: 21.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 5.0,
    fiberGPer100g: 0,
  },
  {
    name: "Prosciutto cotto",
    category: "CARNE",
    kcalPer100g: 145,
    proteinGPer100g: 18.0,
    carbsGPer100g: 1.5,
    fatGPer100g: 7.0,
    fiberGPer100g: 0,
  },
  {
    name: "Bresaola",
    category: "CARNE",
    kcalPer100g: 151,
    proteinGPer100g: 32.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 2.0,
    fiberGPer100g: 0,
  },
  // Pesce
  {
    name: "Salmone",
    category: "PESCE",
    kcalPer100g: 208,
    proteinGPer100g: 20.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 13.0,
    fiberGPer100g: 0,
  },
  {
    name: "Tonno al naturale",
    category: "PESCE",
    kcalPer100g: 116,
    proteinGPer100g: 25.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 1.0,
    fiberGPer100g: 0,
  },
  {
    name: "Merluzzo",
    category: "PESCE",
    kcalPer100g: 82,
    proteinGPer100g: 18.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 0.7,
    fiberGPer100g: 0,
  },
  {
    name: "Orata",
    category: "PESCE",
    kcalPer100g: 121,
    proteinGPer100g: 20.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 4.5,
    fiberGPer100g: 0,
  },
  {
    name: "Gamberi",
    category: "PESCE",
    kcalPer100g: 99,
    proteinGPer100g: 24.0,
    carbsGPer100g: 0.2,
    fatGPer100g: 0.3,
    fiberGPer100g: 0,
  },
  // Latticini e uova
  {
    name: "Latte parzialmente scremato",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 46,
    proteinGPer100g: 3.3,
    carbsGPer100g: 4.9,
    fatGPer100g: 1.6,
    fiberGPer100g: 0,
  },
  {
    name: "Yogurt bianco intero",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 66,
    proteinGPer100g: 3.5,
    carbsGPer100g: 4.5,
    fatGPer100g: 3.5,
    fiberGPer100g: 0,
  },
  {
    name: "Yogurt greco 0%",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 59,
    proteinGPer100g: 10.0,
    carbsGPer100g: 3.6,
    fatGPer100g: 0.4,
    fiberGPer100g: 0,
  },
  {
    name: "Mozzarella",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 253,
    proteinGPer100g: 18.7,
    carbsGPer100g: 0.7,
    fatGPer100g: 19.5,
    fiberGPer100g: 0,
  },
  {
    name: "Parmigiano Reggiano",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 392,
    proteinGPer100g: 33.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 28.0,
    fiberGPer100g: 0,
  },
  {
    name: "Ricotta",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 146,
    proteinGPer100g: 8.8,
    carbsGPer100g: 3.5,
    fatGPer100g: 10.9,
    fiberGPer100g: 0,
  },
  {
    name: "Uova di gallina",
    category: "LATTICINI_E_UOVA",
    kcalPer100g: 143,
    proteinGPer100g: 12.6,
    carbsGPer100g: 0.7,
    fatGPer100g: 9.9,
    fiberGPer100g: 0,
  },
  // Legumi
  {
    name: "Ceci secchi",
    category: "LEGUMI",
    kcalPer100g: 316,
    proteinGPer100g: 20.0,
    carbsGPer100g: 44.0,
    fatGPer100g: 5.0,
    fiberGPer100g: 12.0,
  },
  {
    name: "Lenticchie secche",
    category: "LEGUMI",
    kcalPer100g: 291,
    proteinGPer100g: 24.0,
    carbsGPer100g: 39.0,
    fatGPer100g: 1.0,
    fiberGPer100g: 11.0,
  },
  {
    name: "Fagioli borlotti secchi",
    category: "LEGUMI",
    kcalPer100g: 291,
    proteinGPer100g: 21.0,
    carbsGPer100g: 47.0,
    fatGPer100g: 1.2,
    fiberGPer100g: 13.0,
  },
  {
    name: "Piselli",
    category: "LEGUMI",
    kcalPer100g: 81,
    proteinGPer100g: 5.4,
    carbsGPer100g: 14.0,
    fatGPer100g: 0.4,
    fiberGPer100g: 5.1,
  },
  // Grassi e oli
  {
    name: "Olio extravergine d'oliva",
    category: "GRASSI_E_OLI",
    kcalPer100g: 884,
    proteinGPer100g: 0.0,
    carbsGPer100g: 0.0,
    fatGPer100g: 100.0,
    fiberGPer100g: 0,
  },
  {
    name: "Burro",
    category: "GRASSI_E_OLI",
    kcalPer100g: 758,
    proteinGPer100g: 0.6,
    carbsGPer100g: 0.5,
    fatGPer100g: 83.0,
    fiberGPer100g: 0,
  },
  {
    name: "Noci",
    category: "GRASSI_E_OLI",
    kcalPer100g: 654,
    proteinGPer100g: 15.0,
    carbsGPer100g: 14.0,
    fatGPer100g: 65.0,
    fiberGPer100g: 6.7,
  },
  {
    name: "Mandorle",
    category: "GRASSI_E_OLI",
    kcalPer100g: 579,
    proteinGPer100g: 21.0,
    carbsGPer100g: 22.0,
    fatGPer100g: 50.0,
    fiberGPer100g: 12.0,
  },
  // Bevande
  {
    name: "Acqua",
    category: "BEVANDE",
    kcalPer100g: 0,
    proteinGPer100g: 0,
    carbsGPer100g: 0,
    fatGPer100g: 0,
    fiberGPer100g: 0,
  },
  {
    name: "Caffè (nero)",
    category: "BEVANDE",
    kcalPer100g: 1,
    proteinGPer100g: 0.1,
    carbsGPer100g: 0.0,
    fatGPer100g: 0.0,
    fiberGPer100g: 0,
  },
  {
    name: "Succo d'arancia",
    category: "BEVANDE",
    kcalPer100g: 45,
    proteinGPer100g: 0.7,
    carbsGPer100g: 10.4,
    fatGPer100g: 0.2,
    fiberGPer100g: 0.2,
  },
  {
    name: "Vino rosso",
    category: "BEVANDE",
    kcalPer100g: 85,
    proteinGPer100g: 0.1,
    carbsGPer100g: 2.6,
    fatGPer100g: 0.0,
    fiberGPer100g: 0,
  },
  // Dolci e snack
  {
    name: "Cioccolato fondente",
    category: "DOLCI_E_SNACK",
    kcalPer100g: 546,
    proteinGPer100g: 4.9,
    carbsGPer100g: 61.0,
    fatGPer100g: 31.0,
    fiberGPer100g: 7.0,
  },
  {
    name: "Biscotti frollini",
    category: "DOLCI_E_SNACK",
    kcalPer100g: 450,
    proteinGPer100g: 6.5,
    carbsGPer100g: 68.0,
    fatGPer100g: 16.0,
    fiberGPer100g: 2.0,
  },
  {
    name: "Miele",
    category: "DOLCI_E_SNACK",
    kcalPer100g: 304,
    proteinGPer100g: 0.3,
    carbsGPer100g: 82.4,
    fatGPer100g: 0.0,
    fiberGPer100g: 0.2,
  },
  {
    name: "Zucchero",
    category: "DOLCI_E_SNACK",
    kcalPer100g: 400,
    proteinGPer100g: 0.0,
    carbsGPer100g: 100.0,
    fatGPer100g: 0.0,
    fiberGPer100g: 0.0,
  },
];

export async function seedDevelopmentData(
  db: PostgresJsDatabase<typeof schema>,
): Promise<SeedResult> {
  // --- Plans, features, plan-features -----------------------------------

  const planRowsByKey = new Map<string, typeof schema.plans.$inferSelect>();
  for (const plan of Object.values(PLAN_DEFINITIONS)) {
    const [row] = await db
      .insert(schema.plans)
      .values({ key: plan.key, name: plan.name })
      .onConflictDoUpdate({ target: schema.plans.key, set: { name: plan.name } })
      .returning();
    planRowsByKey.set(plan.key, row);
  }

  const featureRowsByKey = new Map<FeatureKey, typeof schema.features.$inferSelect>();
  for (const [key, def] of Object.entries(FEATURE_DEFINITIONS) as [
    FeatureKey,
    (typeof FEATURE_DEFINITIONS)[FeatureKey],
  ][]) {
    const [row] = await db
      .insert(schema.features)
      .values({ key, name: def.name, description: def.description })
      .onConflictDoUpdate({
        target: schema.features.key,
        set: { name: def.name, description: def.description },
      })
      .returning();
    featureRowsByKey.set(key, row);
  }

  for (const plan of Object.values(PLAN_DEFINITIONS)) {
    const planRow = planRowsByKey.get(plan.key)!;
    for (const featureKey of plan.features) {
      const featureRow = featureRowsByKey.get(featureKey)!;
      await db
        .insert(schema.planFeatures)
        .values({ planId: planRow.id, featureId: featureRow.id })
        .onConflictDoNothing();
    }
  }

  // --- Catalogo alimenti condiviso (non legato a un tenant) ---------------

  for (const item of FOOD_ITEMS_SEED) {
    await db
      .insert(schema.foodItems)
      .values({
        name: item.name,
        category: item.category,
        kcalPer100g: item.kcalPer100g,
        proteinGPer100g: item.proteinGPer100g,
        carbsGPer100g: item.carbsGPer100g,
        fatGPer100g: item.fatGPer100g,
        fiberGPer100g: item.fiberGPer100g,
      })
      .onConflictDoUpdate({
        target: schema.foodItems.name,
        set: {
          category: item.category,
          kcalPer100g: item.kcalPer100g,
          proteinGPer100g: item.proteinGPer100g,
          carbsGPer100g: item.carbsGPer100g,
          fatGPer100g: item.fatGPer100g,
          fiberGPer100g: item.fiberGPer100g,
        },
      });
  }

  // --- Demo tenant + profile ----------------------------------------------

  const [tenant] = await db
    .insert(schema.tenants)
    .values({ name: "Studio Nutrizionale Demo", slug: DEMO_TENANT_SLUG })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Studio Nutrizionale Demo" },
    })
    .returning();

  await db
    .insert(schema.tenantProfiles)
    .values({
      tenantId: tenant.id,
      legalName: "Studio Nutrizionale Demo S.r.l.",
      city: "Milano",
      country: "IT",
      timezone: "Europe/Rome",
    })
    .onConflictDoUpdate({
      target: schema.tenantProfiles.tenantId,
      set: { legalName: "Studio Nutrizionale Demo S.r.l." },
    });

  // --- Demo owner user + membership ---------------------------------------

  const [ownerUser] = await db
    .insert(schema.users)
    .values({ email: DEMO_OWNER_EMAIL, name: "Demo Owner" })
    .onConflictDoUpdate({ target: schema.users.email, set: { name: "Demo Owner" } })
    .returning();

  await db
    .insert(schema.memberships)
    .values({
      tenantId: tenant.id,
      userId: ownerUser.id,
      role: "OWNER",
      status: "ACTIVE",
    })
    .onConflictDoUpdate({
      target: [schema.memberships.tenantId, schema.memberships.userId],
      set: { role: "OWNER", status: "ACTIVE" },
    });

  // --- Entitlements resolved from the PROFESSIONAL plan --------------------

  const demoPlan = PLAN_DEFINITIONS.PROFESSIONAL;
  const demoPlanRow = planRowsByKey.get(demoPlan.key)!;

  for (const featureKey of Object.keys(FEATURE_DEFINITIONS) as FeatureKey[]) {
    const enabled = demoPlan.features.includes(featureKey);
    await db
      .insert(schema.tenantEntitlements)
      .values({ tenantId: tenant.id, kind: "FEATURE", key: featureKey, enabled })
      .onConflictDoUpdate({
        target: [schema.tenantEntitlements.tenantId, schema.tenantEntitlements.key],
        set: { enabled },
      });
  }

  for (const [resourceKey, limitValue] of Object.entries(demoPlan.limits)) {
    await db
      .insert(schema.tenantEntitlements)
      .values({ tenantId: tenant.id, kind: "LIMIT", key: resourceKey, limitValue })
      .onConflictDoUpdate({
        target: [schema.tenantEntitlements.tenantId, schema.tenantEntitlements.key],
        set: { limitValue },
      });
  }

  // --- Demo billing customer + subscription (explicitly fake provider ids) -

  const [billingCustomer] = await db
    .insert(schema.billingCustomers)
    .values({
      tenantId: tenant.id,
      provider: "stripe",
      providerCustomerId: "cus_demo_seed_0001",
    })
    .onConflictDoUpdate({
      target: schema.billingCustomers.tenantId,
      set: { providerCustomerId: "cus_demo_seed_0001" },
    })
    .returning();

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db
    .insert(schema.subscriptions)
    .values({
      tenantId: tenant.id,
      billingCustomerId: billingCustomer.id,
      planId: demoPlanRow.id,
      provider: "stripe",
      providerSubscriptionId: "sub_demo_seed_0001",
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.providerSubscriptionId,
      set: {
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        planId: demoPlanRow.id,
      },
    });

  // --- Demo patients (no real personal data) -------------------------------

  const demoPatients = [
    { firstName: "Anna", lastName: "Bianchi", email: "anna.bianchi@example.test" },
    { firstName: "Marco", lastName: "Rossi", email: "marco.rossi@example.test" },
    { firstName: "Giulia", lastName: "Verdi", email: null },
    { firstName: "Luca", lastName: "Ferrari", email: "luca.ferrari@example.test" },
  ] as const;

  const existingPatients = await db
    .select({ id: schema.patients.id })
    .from(schema.patients)
    .where(eq(schema.patients.tenantId, tenant.id));

  if (existingPatients.length === 0) {
    await db.insert(schema.patients).values(
      demoPatients.map((patient) => ({
        tenantId: tenant.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        status: "ACTIVE" as const,
      })),
    );
  }

  // --- Demo recipes (composte dal catalogo alimenti seedato sopra) ---------

  const existingRecipes = await db
    .select({ id: schema.recipes.id })
    .from(schema.recipes)
    .where(eq(schema.recipes.tenantId, tenant.id));

  if (existingRecipes.length === 0) {
    const foodItemRows = await db
      .select({ id: schema.foodItems.id, name: schema.foodItems.name })
      .from(schema.foodItems);
    const foodItemIdByName = new Map(foodItemRows.map((row) => [row.name, row.id]));

    const demoRecipes: {
      name: string;
      instructions: string;
      ingredients: { foodItemName: string; quantityGrams: number }[];
    }[] = [
      {
        name: "Pollo con riso e zucchine",
        instructions:
          "Cuocere il petto di pollo alla piastra, il riso in acqua bollente, saltare le zucchine in padella con un filo d'olio.",
        ingredients: [
          { foodItemName: "Petto di pollo", quantityGrams: 150 },
          { foodItemName: "Riso brillato", quantityGrams: 80 },
          { foodItemName: "Zucchine", quantityGrams: 150 },
          { foodItemName: "Olio extravergine d'oliva", quantityGrams: 10 },
        ],
      },
      {
        name: "Coppa yogurt e frutta",
        instructions: "Mescolare lo yogurt con la frutta a pezzi e le mandorle.",
        ingredients: [
          { foodItemName: "Yogurt greco 0%", quantityGrams: 150 },
          { foodItemName: "Fragole", quantityGrams: 100 },
          { foodItemName: "Mandorle", quantityGrams: 15 },
        ],
      },
    ];

    for (const demoRecipe of demoRecipes) {
      const [recipe] = await db
        .insert(schema.recipes)
        .values({
          tenantId: tenant.id,
          name: demoRecipe.name,
          instructions: demoRecipe.instructions,
        })
        .returning();

      await db.insert(schema.recipeIngredients).values(
        demoRecipe.ingredients.map((ingredient) => ({
          tenantId: tenant.id,
          recipeId: recipe.id,
          foodItemId: foodItemIdByName.get(ingredient.foodItemName) ?? null,
          quantityGrams: ingredient.quantityGrams,
        })),
      );
    }
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    ownerEmail: ownerUser.email,
    planName: demoPlan.name,
  };
}
