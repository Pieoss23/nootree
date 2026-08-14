import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authIdentityService } from "@/modules/identity";
import { assertPlatformRole } from "./authorization";
import type { PlatformUser } from "./types";

/**
 * Verifies the current request's user is a platform SUPERUSER. Reads
 * `platformRole` from the DB on every call (never trusts a session/JWT
 * claim) so revoking a superuser takes effect immediately, matching the
 * per-request verification pattern in `src/lib/active-tenant.ts`.
 *
 * `cache()` dedupes repeated calls within one render pass (the `/admin`
 * layout and each page both call this), but never across requests — every
 * request re-verifies from scratch, as it should.
 *
 * Throws `UnauthenticatedError` (propagated from `authIdentityService`) if
 * there's no session, or `PlatformAccessDeniedError` if the user exists but
 * isn't a superuser — callers (the `/admin` layout) redirect on either.
 */
export const requireSuperuser = cache(async (): Promise<PlatformUser> => {
  const user = await authIdentityService.requireUser();

  const [row] = await db
    .select({ platformRole: users.platformRole })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const platformRole = row?.platformRole ?? "USER";
  assertPlatformRole(platformRole, "SUPERUSER");

  return { userId: user.id, email: user.email, platformRole };
});
