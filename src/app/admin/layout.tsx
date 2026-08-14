import { redirect } from "next/navigation";
import { requireSuperuser, PlatformAccessDeniedError } from "@/modules/platform";
import { UnauthenticatedError } from "@/modules/identity";

/**
 * Sibling to `(app)/app`, not nested under it: `/admin` is not
 * tenant-scoped (a superuser has no requirement to hold any tenant
 * membership), so it must never depend on `getActiveTenant()`.
 *
 * `src/proxy.ts` only gates "must be logged in" at the edge (see
 * `isAppRouteAuthorized`) — the real SUPERUSER check happens here, same
 * pattern as `(app)/app/layout.tsx` verifying tenant membership server-side.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSuperuser();
  } catch (error) {
    if (error instanceof PlatformAccessDeniedError) redirect("/app");
    if (error instanceof UnauthenticatedError) redirect("/login");
    throw error;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Amministrazione piattaforma
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Cross-tenant</h1>
        <p className="text-sm text-muted-foreground">
          Vista diretta su tutti gli studi — bypassa l&apos;isolamento per tenant. Ogni accesso
          viene registrato nell&apos;audit log.
        </p>
      </header>
      {children}
    </div>
  );
}
