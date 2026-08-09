import { AppSidebar, AppHeader, ErrorState } from "@/components/shared";
import { getDemoTenant } from "@/lib/demo-tenant";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getDemoTenant();

  if (!tenant) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-8">
        <ErrorState
          title="Tenant demo non trovato"
          description="Esegui `pnpm db:seed` per popolare i dati di sviluppo prima di aprire il gestionale."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader userName={tenant.ownerName} userEmail={tenant.ownerEmail} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
