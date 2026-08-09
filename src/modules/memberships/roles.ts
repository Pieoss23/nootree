import type { MembershipRole } from "@/modules/tenancy";

const ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: "Titolare",
  NUTRITIONIST: "Nutrizionista",
  ASSISTANT: "Assistente",
};

const ROLE_RANK: Record<MembershipRole, number> = {
  OWNER: 3,
  NUTRITIONIST: 2,
  ASSISTANT: 1,
};

export function getRoleLabel(role: MembershipRole): string {
  return ROLE_LABELS[role];
}

/** Higher rank = broader permissions. Useful for simple `>=` comparisons. */
export function getRoleRank(role: MembershipRole): number {
  return ROLE_RANK[role];
}

export function roleAtLeast(role: MembershipRole, minimum: MembershipRole): boolean {
  return getRoleRank(role) >= getRoleRank(minimum);
}
