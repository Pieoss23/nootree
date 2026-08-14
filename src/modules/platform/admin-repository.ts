import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, tenantProfiles, memberships, users } from "@/db/schema";
import { getActiveSubscriptionForTenant } from "@/modules/billing";
import { recordAuditEvent } from "@/modules/audit";
import type { AdminTenantOverview, AdminUserOverview } from "./types";

/**
 * The one sanctioned place tenant isolation (ADR 002) is intentionally
 * bypassed — no `tenantId` filter, by design (see ADR 005). Every export
 * here must only be reached after `requireSuperuser()` has verified the
 * caller (enforced by src/app/admin/layout.tsx), and every call is
 * audited via `recordAuditEvent`. Future cross-tenant admin queries belong
 * in this module, not scattered elsewhere.
 */

export async function listAllTenants(actorUserId: string): Promise<AdminTenantOverview[]> {
  const [tenantRows, memberCounts] = await Promise.all([
    db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        legalName: tenantProfiles.legalName,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .leftJoin(tenantProfiles, eq(tenantProfiles.tenantId, tenants.id))
      .orderBy(asc(tenants.createdAt)),
    db
      .select({ tenantId: memberships.tenantId, value: count() })
      .from(memberships)
      .groupBy(memberships.tenantId),
  ]);

  const memberCountByTenant = new Map(memberCounts.map((row) => [row.tenantId, row.value]));

  // N+1 by design for now — one small query per tenant reusing the existing
  // single-tenant subscription resolver (src/modules/billing/repository.ts)
  // rather than duplicating its "latest subscription" ordering logic. Fine
  // at the tenant counts this app targets; revisit if the platform grows
  // enough for this list's latency to matter.
  const subscriptions = await Promise.all(
    tenantRows.map((tenant) => getActiveSubscriptionForTenant(tenant.id)),
  );

  await recordAuditEvent({
    actorUserId,
    action: "admin.tenants.list",
    entityType: "tenant",
    metadata: { count: tenantRows.length },
  });

  return tenantRows.map((tenant, index) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    legalName: tenant.legalName,
    createdAt: tenant.createdAt,
    memberCount: memberCountByTenant.get(tenant.id) ?? 0,
    planKey: subscriptions[index]?.plan.key ?? null,
    planName: subscriptions[index]?.plan.name ?? null,
    subscriptionStatus: subscriptions[index]?.status ?? null,
  }));
}

export async function listAllUsers(actorUserId: string): Promise<AdminUserOverview[]> {
  const [userRows, membershipCounts] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        platformRole: users.platformRole,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt)),
    db
      .select({ userId: memberships.userId, value: count() })
      .from(memberships)
      .groupBy(memberships.userId),
  ]);

  const membershipCountByUser = new Map(membershipCounts.map((row) => [row.userId, row.value]));

  await recordAuditEvent({
    actorUserId,
    action: "admin.users.list",
    entityType: "user",
    metadata: { count: userRows.length },
  });

  return userRows.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    platformRole: user.platformRole,
    createdAt: user.createdAt,
    membershipCount: membershipCountByUser.get(user.id) ?? 0,
  }));
}
