import type { membershipRoleEnum } from "@/db/schema/memberships";

export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];

/**
 * Resolved, server-verified tenant context for the current request. Never
 * construct this from a client-supplied value (header, query param, cookie
 * read without verification) — see docs/security/tenant-isolation-rules.md.
 */
export type TenantContext = {
  tenantId: string;
  userId: string;
  membershipId: string;
  role: MembershipRole;
};
