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

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    ownerEmail: ownerUser.email,
    planName: demoPlan.name,
  };
}
