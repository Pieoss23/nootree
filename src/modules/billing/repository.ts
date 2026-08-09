import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, plans } from "@/db/schema";

export type TenantSubscriptionSummary = {
  status: (typeof subscriptions.$inferSelect)["status"];
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan: { key: string; name: string };
};

export async function getActiveSubscriptionForTenant(
  tenantId: string,
): Promise<TenantSubscriptionSummary | null> {
  const [row] = await db
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planKey: plans.key,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.tenantId, tenantId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!row) return null;

  return {
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    plan: { key: row.planKey, name: row.planName },
  };
}
