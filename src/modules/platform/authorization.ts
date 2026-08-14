import type { PlatformRole } from "./types";
import { platformRoleAtLeast } from "./roles";

export class PlatformAccessDeniedError extends Error {
  constructor(
    public readonly role: PlatformRole,
    public readonly minimum: PlatformRole,
  ) {
    super(`Platform role "${role}" does not meet the minimum required role "${minimum}".`);
    this.name = "PlatformAccessDeniedError";
  }
}

/** Call sites must never compare `role` against a literal; the ranking lives in `platformRoleAtLeast` only. */
export function assertPlatformRole(role: PlatformRole, minimum: PlatformRole): void {
  if (!platformRoleAtLeast(role, minimum)) {
    throw new PlatformAccessDeniedError(role, minimum);
  }
}
