import { listAllTenants, requireSuperuser } from "@/modules/platform";
import { PageHeader, EmptyState } from "@/components/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  const superuser = await requireSuperuser();
  const tenants = await listAllTenants(superuser.userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutti gli studi"
        description={`${tenants.length} stud${tenants.length === 1 ? "io registrato" : "i registrati"} sulla piattaforma.`}
      />

      {tenants.length === 0 ? (
        <EmptyState title="Nessuno studio registrato" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Studio</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead>Abbonamento</TableHead>
                <TableHead>Membri</TableHead>
                <TableHead>Creato il</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium text-foreground">
                    {tenant.name}
                    {tenant.legalName ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {tenant.legalName}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{tenant.planName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant.subscriptionStatus ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.memberCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant.createdAt.toLocaleDateString("it-IT")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
