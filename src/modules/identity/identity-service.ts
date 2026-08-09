import "server-only";
import { auth, signOut as authSignOut } from "@/lib/auth";
import type { IdentityService } from "./service";
import { UnauthenticatedError } from "./service";
import type { CurrentUser } from "./types";

async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}

/** Auth.js-backed implementation of `IdentityService` (see src/lib/auth.ts). */
export const authIdentityService: IdentityService = {
  getCurrentUser,
  async requireUser(): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) throw new UnauthenticatedError();
    return user;
  },
  async signOut(): Promise<void> {
    // No `redirectTo`: redirecting is a UI concern, left to the caller. It
    // also avoids Auth.js's internal `redirect()` throw racing a client
    // component that unmounts mid-request (e.g. a menu closing on click).
    await authSignOut({ redirect: false });
  },
};
