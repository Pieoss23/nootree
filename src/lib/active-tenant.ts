import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, tenantProfiles } from "@/db/schema";
import { authIdentityService, UnauthenticatedError } from "@/modules/identity";
import { tenantResolver, type TenantContext } from "@/modules/tenancy";

export type ActiveTenant = TenantContext & {
  tenantName: string;
  studioLegalName: string | null;
  userName: string;
  userEmail: string;
};

/**
 * Data Access Layer for "the tenant the current request is acting on".
 * `cache()` dedupes repeated calls within one render pass (layout + page
 * both call this), but never across requests/Server Actions — every Server
 * Action re-verifies from scratch, as it should.
 *
 * `/app/*` is already gated by src/proxy.ts, so `requireUser()` failing here
 * would be unexpected; the redirect is defense-in-depth, matching the DAL
 * pattern in the Next.js authentication guide.
 */
export const getActiveTenant = cache(async (): Promise<ActiveTenant | null> => {
  let user;
  try {
    user = await authIdentityService.requireUser();
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }

  const tenantContext = await tenantResolver.resolveActiveTenant(user);
  if (!tenantContext) return null;

  const [row] = await db
    .select({ tenantName: tenants.name, legalName: tenantProfiles.legalName })
    .from(tenants)
    .leftJoin(tenantProfiles, eq(tenantProfiles.tenantId, tenants.id))
    .where(eq(tenants.id, tenantContext.tenantId))
    .limit(1);

  return {
    ...tenantContext,
    tenantName: row?.tenantName ?? "",
    studioLegalName: row?.legalName ?? null,
    userName: user.name ?? user.email,
    userEmail: user.email,
  };
});
