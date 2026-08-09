import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantEntitlements } from "@/db/schema";
import type { FeatureKey, ResourceKey } from "@/config/plans";
import { FeatureNotAvailableError, ResourceLimitExceededError } from "./errors";

/**
 * Resolved entitlements always come from `tenant_entitlements` (populated
 * from the tenant's plan, with room for per-tenant overrides — see
 * docs/domain-model). Call sites must never re-derive access from a raw
 * plan key (`if (plan === "PROFESSIONAL")`); that logic lives here only.
 */

export async function hasFeature(tenantId: string, featureKey: FeatureKey): Promise<boolean> {
  const [row] = await db
    .select({ enabled: tenantEntitlements.enabled })
    .from(tenantEntitlements)
    .where(
      and(
        eq(tenantEntitlements.tenantId, tenantId),
        eq(tenantEntitlements.kind, "FEATURE"),
        eq(tenantEntitlements.key, featureKey),
      ),
    )
    .limit(1);

  return row?.enabled === true;
}

export async function assertFeature(tenantId: string, featureKey: FeatureKey): Promise<void> {
  if (!(await hasFeature(tenantId, featureKey))) {
    throw new FeatureNotAvailableError(featureKey);
  }
}

/** Returns `null` when the resource is unlimited or has no entitlement row. */
export async function getResourceLimit(
  tenantId: string,
  resourceKey: ResourceKey,
): Promise<number | null> {
  const [row] = await db
    .select({ limitValue: tenantEntitlements.limitValue })
    .from(tenantEntitlements)
    .where(
      and(
        eq(tenantEntitlements.tenantId, tenantId),
        eq(tenantEntitlements.kind, "LIMIT"),
        eq(tenantEntitlements.key, resourceKey),
      ),
    )
    .limit(1);

  return row?.limitValue ?? null;
}

/**
 * `currentUsage` is supplied by the caller (e.g. the patients module counts
 * its own active patients) so this module never needs to know about other
 * domains' tables.
 */
export async function assertWithinLimit(
  tenantId: string,
  resourceKey: ResourceKey,
  currentUsage: number,
): Promise<void> {
  const limit = await getResourceLimit(tenantId, resourceKey);
  if (limit !== null && currentUsage >= limit) {
    throw new ResourceLimitExceededError(resourceKey, limit, currentUsage);
  }
}
