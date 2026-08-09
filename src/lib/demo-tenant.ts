import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, tenantProfiles, memberships, users } from "@/db/schema";

const DEMO_TENANT_SLUG = "demo-studio";

export type DemoTenant = {
  tenantId: string;
  tenantName: string;
  studioLegalName: string | null;
  ownerName: string;
  ownerEmail: string;
};

/**
 * TEMPORARY: resolves the seeded demo tenant directly, bypassing session
 * and membership checks. Milestone 1 has no authentication yet, so the
 * `(app)` pages use this instead of a real `TenantContext`. Must be removed
 * once Milestone 1.1 wires up session-based tenant resolution — see
 * docs/architecture/multi-tenancy.md.
 */
export async function getDemoTenant(): Promise<DemoTenant | null> {
  const [row] = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      legalName: tenantProfiles.legalName,
    })
    .from(tenants)
    .leftJoin(tenantProfiles, eq(tenantProfiles.tenantId, tenants.id))
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);

  if (!row) return null;

  const [owner] = await db
    .select({ name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.tenantId, row.tenantId), eq(memberships.role, "OWNER")))
    .limit(1);

  return {
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    studioLegalName: row.legalName,
    ownerName: owner?.name ?? "Owner",
    ownerEmail: owner?.email ?? "owner@example.com",
  };
}
