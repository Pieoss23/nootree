/**
 * Kept dependency-free (no `next-auth` import) so it's unit-testable without
 * pulling in the Auth.js module graph. Used by the `authorized` callback in
 * `src/lib/auth.ts`.
 */
export function isAppRouteAuthorized(pathname: string, hasSession: boolean): boolean {
  if (!pathname.startsWith("/app")) return true;
  return hasSession;
}
