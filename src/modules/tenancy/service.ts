import type { CurrentUser } from "@/modules/identity";
import type { TenantContext } from "./types";

/**
 * Resolves which tenant the current request is acting on and verifies the
 * user actually belongs to it. This is the only supported path to a
 * `TenantContext` — a `tenantId` read from the browser (query param,
 * client state, unverified cookie) must never be trusted as-is.
 * Not implemented yet: see Milestone 1.1.
 */
export interface TenantResolver {
  resolveActiveTenant(user: CurrentUser): Promise<TenantContext | null>;
}

/**
 * Verifies a user has an active membership in a given tenant, independent
 * of which tenant is "active" in their session.
 */
export interface MembershipChecker {
  verifyMembership(input: { userId: string; tenantId: string }): Promise<TenantContext | null>;
}

export class TenantAccessDeniedError extends Error {
  constructor(tenantId: string) {
    super(`Current user has no active membership in tenant ${tenantId}.`);
    this.name = "TenantAccessDeniedError";
  }
}
