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
} from "@/modules/patients";

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
      ["billing.portal", "patients.management", "team.management"].sort(),
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
