import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { seedDevelopmentData, DEMO_TENANT_SLUG } from "@/db/seed-core";
import {
  listPatientsByTenant,
  getPatientById,
  createPatient,
  updatePatient,
  setPatientStatus,
  updatePatientClinicalInfo,
  listMeasurementsByPatient,
  createMeasurement,
} from "@/modules/patients";
import { tenantResolver, membershipChecker } from "@/modules/tenancy";
import {
  listFoodItems,
  listTenantProducts,
  createTenantProduct,
  updateTenantProduct,
} from "@/modules/products";
import {
  listRecipesByTenant,
  createRecipe,
  addRecipeIngredient,
  listRecipeIngredients,
  listActiveRecipeSummariesByTenant,
  createPatientRecipe,
  listPatientRecipes,
} from "@/modules/recipes";

/**
 * Exercises the database against TEST_DATABASE_URL only — never the
 * development database (see docs/testing/milestone-01-test-strategy.md).
 * Skipped entirely when TEST_DATABASE_URL isn't configured, so `pnpm test`
 * still passes in environments without a local Postgres instance.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testDatabaseUrl)("database integration", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let migrationClient: postgres.Sql;

  beforeAll(async () => {
    migrationClient = postgres(testDatabaseUrl!, { max: 1 });

    // Start from a genuinely empty database so this suite also verifies
    // "migrations apply cleanly from an empty database".
    await migrationClient`DROP SCHEMA IF EXISTS public CASCADE`;
    await migrationClient`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await migrationClient`CREATE SCHEMA public`;

    const migrationDb = drizzle(migrationClient);
    await migrate(migrationDb, { migrationsFolder: "./src/db/migrations" });

    db = drizzle(migrationClient, { schema });
  }, 30_000);

  afterAll(async () => {
    await migrationClient.end();
  });

  it("connects to the test database", async () => {
    const result = await db.execute(sql`select 1 as ok`);
    expect(result[0]).toEqual({ ok: 1 });
  });

  it("has applied all expected tables from an empty database", async () => {
    const rows = await migrationClient`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name = 'patients'
    `;
    expect(rows.length).toBe(1);
  });

  it("seeds development data idempotently", async () => {
    const first = await seedDevelopmentData(db);
    const [{ count: firstCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.patients)
      .where(eq(schema.patients.tenantId, first.tenantId));

    const second = await seedDevelopmentData(db);
    const [{ count: secondCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.patients)
      .where(eq(schema.patients.tenantId, second.tenantId));

    expect(second.tenantId).toBe(first.tenantId);
    expect(secondCount).toBe(firstCount);

    const [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, DEMO_TENANT_SLUG));
    expect(tenant).toBeDefined();
  });

  it("associates the PROFESSIONAL plan with exactly its configured features", async () => {
    const rows = await db
      .select({ featureKey: schema.features.key })
      .from(schema.planFeatures)
      .innerJoin(schema.plans, eq(schema.planFeatures.planId, schema.plans.id))
      .innerJoin(schema.features, eq(schema.planFeatures.featureId, schema.features.id))
      .where(eq(schema.plans.key, "PROFESSIONAL"));

    const featureKeys = rows.map((row) => row.featureKey).sort();
    expect(featureKeys).toEqual(
      [
        "billing.portal",
        "nutrition.plans",
        "patients.management",
        "products.catalog",
        "recipes.management",
        "team.management",
      ].sort(),
    );
  });

  it("allows the same patient email across different tenants", async () => {
    const sharedEmail = "shared@example.test";
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Tenant A", slug: `tenant-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Tenant B", slug: `tenant-b-${randomUUID()}` })
      .returning();

    await expect(
      db.insert(schema.patients).values([
        { tenantId: tenantA.id, firstName: "Same", lastName: "Email", email: sharedEmail },
        { tenantId: tenantB.id, firstName: "Same", lastName: "Email", email: sharedEmail },
      ]),
    ).resolves.not.toThrow();

    const patientsA = await listPatientsByTenant({ tenantId: tenantA.id });
    const patientsB = await listPatientsByTenant({ tenantId: tenantB.id });
    expect(patientsA).toHaveLength(1);
    expect(patientsB).toHaveLength(1);
    expect(patientsA[0].email).toBe(sharedEmail);
    expect(patientsB[0].email).toBe(sharedEmail);
  });

  it("enforces one membership per (tenant, user) pair", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Membership Tenant", slug: `membership-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `membership-${randomUUID()}@example.test` })
      .returning();

    await db.insert(schema.memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    });

    await expect(
      db.insert(schema.memberships).values({
        tenantId: tenant.id,
        userId: user.id,
        role: "ASSISTANT",
        status: "PENDING",
      }),
    ).rejects.toThrow();
  });

  it("enforces webhook event id uniqueness per provider", async () => {
    const providerEventId = `evt_${randomUUID()}`;

    await db.insert(schema.webhookEvents).values({
      provider: "stripe",
      providerEventId,
      type: "customer.subscription.updated",
    });

    await expect(
      db.insert(schema.webhookEvents).values({
        provider: "stripe",
        providerEventId,
        type: "customer.subscription.updated",
      }),
    ).rejects.toThrow();
  });

  it("scopes patient reads to the requested tenant", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Scoped A", slug: `scoped-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Scoped B", slug: `scoped-b-${randomUUID()}` })
      .returning();

    const [patientA] = await db
      .insert(schema.patients)
      .values({ tenantId: tenantA.id, firstName: "Solo", lastName: "TenantA" })
      .returning();

    const listForA = await listPatientsByTenant({ tenantId: tenantA.id });
    const listForB = await listPatientsByTenant({ tenantId: tenantB.id });
    expect(listForA.map((p) => p.id)).toContain(patientA.id);
    expect(listForB.map((p) => p.id)).not.toContain(patientA.id);

    const crossTenantLookup = await getPatientById({
      tenantId: tenantB.id,
      patientId: patientA.id,
    });
    expect(crossTenantLookup).toBeNull();

    const sameTenantLookup = await getPatientById({
      tenantId: tenantA.id,
      patientId: patientA.id,
    });
    expect(sameTenantLookup?.id).toBe(patientA.id);
  });

  it("rejects invalid membership status/role enum values at the DB level", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Enum Tenant", slug: `enum-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `enum-${randomUUID()}@example.test` })
      .returning();

    const invalidRoleValues = {
      tenantId: tenant.id,
      userId: user.id,
      role: "SUPERADMIN",
      status: "ACTIVE",
    } as unknown as typeof schema.memberships.$inferInsert;

    await expect(db.insert(schema.memberships).values(invalidRoleValues)).rejects.toThrow();
  });

  it("createPatient scopes the new row to the given tenant", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Create Tenant", slug: `create-${randomUUID()}` })
      .returning();

    const patient = await createPatient({
      tenantId: tenant.id,
      firstName: "Nuovo",
      lastName: "Paziente",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });

    expect(patient.tenantId).toBe(tenant.id);
    expect(patient.status).toBe("ACTIVE");

    const fetched = await getPatientById({ tenantId: tenant.id, patientId: patient.id });
    expect(fetched?.id).toBe(patient.id);
  });

  it("updatePatient refuses to update a patient belonging to another tenant", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Update Tenant A", slug: `update-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Update Tenant B", slug: `update-b-${randomUUID()}` })
      .returning();

    const patient = await createPatient({
      tenantId: tenantA.id,
      firstName: "Prima",
      lastName: "Versione",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });

    const crossTenantUpdate = await updatePatient({
      tenantId: tenantB.id,
      patientId: patient.id,
      firstName: "Modificato",
      lastName: "DaAltroTenant",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });
    expect(crossTenantUpdate).toBeNull();

    const untouched = await getPatientById({ tenantId: tenantA.id, patientId: patient.id });
    expect(untouched?.firstName).toBe("Prima");

    const sameTenantUpdate = await updatePatient({
      tenantId: tenantA.id,
      patientId: patient.id,
      firstName: "Seconda",
      lastName: "Versione",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });
    expect(sameTenantUpdate?.firstName).toBe("Seconda");
  });

  it("setPatientStatus archives and reactivates a patient, tracking archivedAt", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Status Tenant", slug: `status-${randomUUID()}` })
      .returning();
    const patient = await createPatient({
      tenantId: tenant.id,
      firstName: "Stato",
      lastName: "Paziente",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });

    const archived = await setPatientStatus({
      tenantId: tenant.id,
      patientId: patient.id,
      status: "ARCHIVED",
    });
    expect(archived?.status).toBe("ARCHIVED");
    expect(archived?.archivedAt).not.toBeNull();

    const reactivated = await setPatientStatus({
      tenantId: tenant.id,
      patientId: patient.id,
      status: "ACTIVE",
    });
    expect(reactivated?.status).toBe("ACTIVE");
    expect(reactivated?.archivedAt).toBeNull();
  });

  it("resolveActiveTenant returns the tenant for a user's only active membership", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Resolver Tenant", slug: `resolver-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `resolver-${randomUUID()}@example.test` })
      .returning();
    await db.insert(schema.memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    });

    const context = await tenantResolver.resolveActiveTenant({
      id: user.id,
      email: user.email,
      name: null,
      image: null,
    });

    expect(context?.tenantId).toBe(tenant.id);
    expect(context?.role).toBe("OWNER");
  });

  it("resolveActiveTenant returns null for a user with no active membership", async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: `no-membership-${randomUUID()}@example.test` })
      .returning();

    const context = await tenantResolver.resolveActiveTenant({
      id: user.id,
      email: user.email,
      name: null,
      image: null,
    });

    expect(context).toBeNull();
  });

  it("resolveActiveTenant ignores a SUSPENDED membership", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Suspended Tenant", slug: `suspended-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `suspended-${randomUUID()}@example.test` })
      .returning();
    await db.insert(schema.memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: "ASSISTANT",
      status: "SUSPENDED",
    });

    const context = await tenantResolver.resolveActiveTenant({
      id: user.id,
      email: user.email,
      name: null,
      image: null,
    });

    expect(context).toBeNull();
  });

  it("verifyMembership returns null for a user not in that tenant", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Membership Check A", slug: `membership-check-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Membership Check B", slug: `membership-check-b-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `membership-check-${randomUUID()}@example.test` })
      .returning();
    await db.insert(schema.memberships).values({
      tenantId: tenantA.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    });

    const validMembership = await membershipChecker.verifyMembership({
      userId: user.id,
      tenantId: tenantA.id,
    });
    expect(validMembership?.tenantId).toBe(tenantA.id);

    const crossTenantMembership = await membershipChecker.verifyMembership({
      userId: user.id,
      tenantId: tenantB.id,
    });
    expect(crossTenantMembership).toBeNull();
  });

  it("updatePatientClinicalInfo refuses to update a patient belonging to another tenant", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Clinical Tenant A", slug: `clinical-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Clinical Tenant B", slug: `clinical-b-${randomUUID()}` })
      .returning();

    const patient = await createPatient({
      tenantId: tenantA.id,
      firstName: "Anamnesi",
      lastName: "Paziente",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });

    const crossTenantUpdate = await updatePatientClinicalInfo({
      tenantId: tenantB.id,
      patientId: patient.id,
      allergiesIntolerances: "Glutine",
      pathologies: null,
      medications: null,
      nutritionGoal: null,
      activityLevel: null,
      dietIntensity: null,
      healthDataConsentAt: null,
    });
    expect(crossTenantUpdate).toBeNull();

    const untouched = await getPatientById({ tenantId: tenantA.id, patientId: patient.id });
    expect(untouched?.allergiesIntolerances).toBeNull();

    const sameTenantUpdate = await updatePatientClinicalInfo({
      tenantId: tenantA.id,
      patientId: patient.id,
      allergiesIntolerances: "Glutine",
      pathologies: null,
      medications: null,
      nutritionGoal: "WEIGHT_LOSS",
      activityLevel: "MODERATE",
      dietIntensity: null,
      healthDataConsentAt: null,
    });
    expect(sameTenantUpdate?.allergiesIntolerances).toBe("Glutine");
    expect(sameTenantUpdate?.nutritionGoal).toBe("WEIGHT_LOSS");
  });

  it("scopes measurements to the requested tenant and orders by measuredAt", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Measurements Tenant A", slug: `measurements-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Measurements Tenant B", slug: `measurements-b-${randomUUID()}` })
      .returning();

    const patient = await createPatient({
      tenantId: tenantA.id,
      firstName: "Misurato",
      lastName: "Paziente",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });

    const measurementFields = {
      heightCm: null,
      waistCm: null,
      hipCm: null,
      armCm: null,
      bodyFatPercent: null,
      bodyWaterPercent: null,
      leanMassKg: null,
      cellMassKg: null,
      phaseAngle: null,
      basalMetabolicRateKcal: null,
      notes: null,
    };

    await createMeasurement({
      tenantId: tenantA.id,
      patientId: patient.id,
      measuredAt: "2026-02-01",
      weightKg: 80,
      ...measurementFields,
    });
    await createMeasurement({
      tenantId: tenantA.id,
      patientId: patient.id,
      measuredAt: "2026-01-01",
      weightKg: 82,
      ...measurementFields,
    });

    const measurementsForA = await listMeasurementsByPatient({
      tenantId: tenantA.id,
      patientId: patient.id,
    });
    expect(measurementsForA).toHaveLength(2);
    expect(measurementsForA[0].measuredAt).toBe("2026-01-01");
    expect(measurementsForA[0].weightKg).toBe(82);
    expect(measurementsForA[1].measuredAt).toBe("2026-02-01");

    const measurementsForB = await listMeasurementsByPatient({
      tenantId: tenantB.id,
      patientId: patient.id,
    });
    expect(measurementsForB).toHaveLength(0);
  });

  it("seeds a shared food catalog not scoped to any tenant", async () => {
    await seedDevelopmentData(db);
    const items = await listFoodItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.find((item) => item.name === "Pasta di semola (secca)")).toBeDefined();
  });

  it("scopes tenant products to the requested tenant and refuses cross-tenant updates", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Products Tenant A", slug: `products-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Products Tenant B", slug: `products-b-${randomUUID()}` })
      .returning();

    const product = await createTenantProduct({
      tenantId: tenantA.id,
      name: "Insalata dello chef",
      kcalPer100g: 120,
      proteinGPer100g: null,
      carbsGPer100g: null,
      fatGPer100g: null,
      fiberGPer100g: null,
      notes: null,
    });

    const listForA = await listTenantProducts({ tenantId: tenantA.id });
    const listForB = await listTenantProducts({ tenantId: tenantB.id });
    expect(listForA.map((p) => p.id)).toContain(product.id);
    expect(listForB.map((p) => p.id)).not.toContain(product.id);

    const crossTenantUpdate = await updateTenantProduct({
      tenantId: tenantB.id,
      productId: product.id,
      name: "Modificato da altro tenant",
      kcalPer100g: 200,
      proteinGPer100g: null,
      carbsGPer100g: null,
      fatGPer100g: null,
      fiberGPer100g: null,
      notes: null,
    });
    expect(crossTenantUpdate).toBeNull();
  });

  it("scopes recipes to the requested tenant and computes ingredient nutrition via the join", async () => {
    await seedDevelopmentData(db);
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Recipes Tenant A", slug: `recipes-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Recipes Tenant B", slug: `recipes-b-${randomUUID()}` })
      .returning();

    const [chicken] = await db
      .select()
      .from(schema.foodItems)
      .where(eq(schema.foodItems.name, "Petto di pollo"));

    const recipe = await createRecipe({
      tenantId: tenantA.id,
      name: "Pollo semplice",
      instructions: null,
    });
    await addRecipeIngredient({
      tenantId: tenantA.id,
      recipeId: recipe.id,
      foodItemId: chicken.id,
      tenantProductId: null,
      quantityGrams: 200,
    });

    const ingredients = await listRecipeIngredients({ tenantId: tenantA.id, recipeId: recipe.id });
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].source).toBe("FOOD_ITEM");
    expect(ingredients[0].name).toBe("Petto di pollo");
    expect(ingredients[0].kcalPer100g).toBe(chicken.kcalPer100g);

    const recipesForA = await listRecipesByTenant({ tenantId: tenantA.id });
    const recipesForB = await listRecipesByTenant({ tenantId: tenantB.id });
    expect(recipesForA.map((r) => r.id)).toContain(recipe.id);
    expect(recipesForB.map((r) => r.id)).not.toContain(recipe.id);

    const summaries = await listActiveRecipeSummariesByTenant({ tenantId: tenantA.id });
    const summary = summaries.find((s) => s.id === recipe.id);
    expect(summary?.totalGrams).toBe(200);
    expect(summary?.kcalPer100g).toBeCloseTo(chicken.kcalPer100g);
  });

  it("rejects a recipe ingredient with both or neither ingredient source set", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Ingredient Source Tenant", slug: `ingredient-source-${randomUUID()}` })
      .returning();
    const recipe = await createRecipe({ tenantId: tenant.id, name: "Test", instructions: null });
    const [foodItem] = await db.select().from(schema.foodItems).limit(1);
    const [product] = await db
      .insert(schema.tenantProducts)
      .values({ tenantId: tenant.id, name: "Prodotto test", kcalPer100g: 100 })
      .returning();

    await expect(
      db.insert(schema.recipeIngredients).values({
        tenantId: tenant.id,
        recipeId: recipe.id,
        foodItemId: null,
        tenantProductId: null,
        quantityGrams: 100,
      }),
    ).rejects.toThrow();

    await expect(
      db.insert(schema.recipeIngredients).values({
        tenantId: tenant.id,
        recipeId: recipe.id,
        foodItemId: foodItem.id,
        tenantProductId: product.id,
        quantityGrams: 100,
      }),
    ).rejects.toThrow();
  });

  it("scopes patient recipe assignments to the requested tenant", async () => {
    const [tenantA] = await db
      .insert(schema.tenants)
      .values({ name: "Patient Recipes Tenant A", slug: `patient-recipes-a-${randomUUID()}` })
      .returning();
    const [tenantB] = await db
      .insert(schema.tenants)
      .values({ name: "Patient Recipes Tenant B", slug: `patient-recipes-b-${randomUUID()}` })
      .returning();

    const patient = await createPatient({
      tenantId: tenantA.id,
      firstName: "Con",
      lastName: "Ricetta",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });
    const recipe = await createRecipe({
      tenantId: tenantA.id,
      name: "Ricetta assegnata",
      instructions: null,
    });

    const assignment = await createPatientRecipe({
      tenantId: tenantA.id,
      patientId: patient.id,
      recipeId: recipe.id,
      portionGrams: 150,
      suggestedPortionGrams: 140,
      notes: null,
    });

    const forA = await listPatientRecipes({ tenantId: tenantA.id, patientId: patient.id });
    const forB = await listPatientRecipes({ tenantId: tenantB.id, patientId: patient.id });
    expect(forA.map((p) => p.id)).toContain(assignment.id);
    expect(forA[0].recipeName).toBe("Ricetta assegnata");
    expect(forB).toHaveLength(0);
  });

  it("cascades tenant deletion to its memberships (not silently orphaned)", async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: "Cascade Tenant", slug: `cascade-${randomUUID()}` })
      .returning();
    const [user] = await db
      .insert(schema.users)
      .values({ email: `cascade-${randomUUID()}@example.test` })
      .returning();
    await db.insert(schema.memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    });

    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenant.id));

    const remaining = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenant.id));
    expect(remaining).toHaveLength(0);
  });
});
