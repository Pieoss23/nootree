import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import type { CurrentUser } from "@/modules/identity";
import type { MembershipChecker, TenantResolver } from "./service";
import type { TenantContext } from "./types";

/**
 * A user can belong to more than one tenant, but this milestone has no
 * tenant-switching UI yet, so "the active tenant" is simply the oldest
 * active membership. Revisit once switching between tenants is supported.
 */
async function resolveActiveTenant(user: CurrentUser): Promise<TenantContext | null> {
  const [row] = await db
    .select({
      tenantId: memberships.tenantId,
      membershipId: memberships.id,
      role: memberships.role,
    })
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "ACTIVE")))
    .orderBy(asc(memberships.createdAt))
    .limit(1);

  if (!row) return null;

  return {
    tenantId: row.tenantId,
    userId: user.id,
    membershipId: row.membershipId,
    role: row.role,
  };
}

async function verifyMembership(input: {
  userId: string;
  tenantId: string;
}): Promise<TenantContext | null> {
  const [row] = await db
    .select({ membershipId: memberships.id, role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, input.userId),
        eq(memberships.tenantId, input.tenantId),
        eq(memberships.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    membershipId: row.membershipId,
    role: row.role,
  };
}

/** Drizzle-backed implementation of `TenantResolver`/`MembershipChecker`. */
export const tenantResolver: TenantResolver = { resolveActiveTenant };
export const membershipChecker: MembershipChecker = { verifyMembership };
