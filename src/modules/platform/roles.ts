import type { PlatformRole } from "./types";

const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  USER: "Utente",
  SUPERUSER: "Superuser",
};

const PLATFORM_ROLE_RANK: Record<PlatformRole, number> = {
  USER: 1,
  SUPERUSER: 2,
};

export function getPlatformRoleLabel(role: PlatformRole): string {
  return PLATFORM_ROLE_LABELS[role];
}

/** Higher rank = broader permissions. Useful for simple `>=` comparisons. */
export function getPlatformRoleRank(role: PlatformRole): number {
  return PLATFORM_ROLE_RANK[role];
}

export function platformRoleAtLeast(role: PlatformRole, minimum: PlatformRole): boolean {
  return getPlatformRoleRank(role) >= getPlatformRoleRank(minimum);
}
