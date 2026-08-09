import { PageHeader, UsageMeter } from "@/components/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { getDemoTenant } from "@/lib/demo-tenant";
import { countActivePatients, listPatientsByTenant } from "@/modules/patients";
import { PatientsTable } from "@/modules/patients/patients-table";
import { getResourceLimit } from "@/modules/entitlements";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const tenant = await getDemoTenant();
  if (!tenant) return null;

  const [patients, activePatients, patientLimit] = await Promise.all([
    listPatientsByTenant({ tenantId: tenant.tenantId }),
    countActivePatients(tenant.tenantId),
    getResourceLimit(tenant.tenantId, "activePatients"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pazienti"
        description="Anagrafica pazienti dello studio."
        actions={
          <Tooltip>
            <TooltipTrigger render={<Button disabled>Nuovo paziente</Button>} />
            <TooltipContent>
              La creazione pazienti non è ancora disponibile in questa milestone.
            </TooltipContent>
          </Tooltip>
        }
      />

      <div className="max-w-xs">
        <UsageMeter label="Pazienti attivi" current={activePatients} limit={patientLimit} />
      </div>

      <PatientsTable patients={patients} />
    </div>
  );
}
