import { PageHeader, StatusBadge, EmptyState } from "@/components/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDemoTenant } from "@/lib/demo-tenant";
import { listMembershipsByTenant, getRoleLabel } from "@/modules/memberships";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
} as const;

const STATUS_LABEL = {
  ACTIVE: "Attivo",
  PENDING: "In attesa",
  SUSPENDED: "Sospeso",
} as const;

export default async function TeamPage() {
  const tenant = await getDemoTenant();
  if (!tenant) return null;

  const memberships = await listMembershipsByTenant(tenant.tenantId);

  return (
    <div className="space-y-8">
      <PageHeader title="Team" description="Membri dello studio e relativi ruoli." />

      {memberships.length === 0 ? (
        <EmptyState
          title="Nessun membro"
          description="Non ci sono ancora membri in questo studio."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium text-foreground">
                    {membership.user.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{membership.user.email}</TableCell>
                  <TableCell>{getRoleLabel(membership.role)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={STATUS_LABEL[membership.status]}
                      tone={STATUS_TONE[membership.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Gli inviti al team non sono ancora disponibili in questa milestone: sarà possibile invitare
        nuovi membri via email in un aggiornamento successivo.
      </div>
    </div>
  );
}
