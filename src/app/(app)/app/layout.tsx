import { AppSidebar, AppHeader, ErrorState } from "@/components/shared";
import { getActiveTenant } from "@/lib/active-tenant";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getActiveTenant();

  if (!tenant) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-8">
        <ErrorState
          title="Nessuno studio associato"
          description="Il tuo account non è ancora membro di nessuno studio. Contatta chi ti ha invitato o esegui `pnpm db:seed` in sviluppo."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader userName={tenant.userName} userEmail={tenant.userEmail} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
