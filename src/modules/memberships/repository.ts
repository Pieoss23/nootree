import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, users } from "@/db/schema";

export type MembershipWithUser = {
  id: string;
  role: (typeof memberships.$inferSelect)["role"];
  status: (typeof memberships.$inferSelect)["status"];
  createdAt: Date;
  user: { id: string; email: string; name: string | null };
};

/**
 * Lists memberships for a tenant. Every read here is scoped by `tenantId`
 * from a verified `TenantContext` — never accept a tenant id from the
 * client without going through the tenancy module first.
 */
export async function listMembershipsByTenant(tenantId: string): Promise<MembershipWithUser[]> {
  const rows = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      status: memberships.status,
      createdAt: memberships.createdAt,
      userId: users.id,
      userEmail: users.email,
      userName: users.name,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.tenantId, tenantId));

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    user: { id: row.userId, email: row.userEmail, name: row.userName },
  }));
}
