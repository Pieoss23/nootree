/**
 * Kept dependency-free (no `next-auth` import) so it's unit-testable without
 * pulling in the Auth.js module graph. Used by the `authorized` callback in
 * `src/lib/auth.ts`.
 *
 * This is a coarse "must be logged in" gate only, for both `/app` (tenant
 * app) and `/admin` (platform admin) — it has no DB access, so it cannot
 * check `platformRole`. The real SUPERUSER check happens server-side, in
 * `src/app/admin/layout.tsx` via `requireSuperuser()`, the same way tenant
 * resolution is never done at the edge either (see `getActiveTenant`).
 */
export function isAppRouteAuthorized(pathname: string, hasSession: boolean): boolean {
  if (!pathname.startsWith("/app") && !pathname.startsWith("/admin")) return true;
  return hasSession;
}
