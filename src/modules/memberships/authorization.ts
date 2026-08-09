import type { MembershipRole } from "@/modules/tenancy";
import { roleAtLeast } from "./roles";

export class InsufficientRoleError extends Error {
  constructor(
    public readonly role: MembershipRole,
    public readonly minimum: MembershipRole,
  ) {
    super(`Role "${role}" does not meet the minimum required role "${minimum}".`);
    this.name = "InsufficientRoleError";
  }
}

/** Call sites must never compare `role` against a literal; the ranking lives in `roleAtLeast` only. */
export function assertRole(role: MembershipRole, minimum: MembershipRole): void {
  if (!roleAtLeast(role, minimum)) {
    throw new InsufficientRoleError(role, minimum);
  }
}
