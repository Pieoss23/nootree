import { PatientsPageClient } from "./patients-page-client";
import { getDemoTenant } from "@/lib/demo-tenant";
import { countActivePatients, listPatientsByTenant } from "@/modules/patients";
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
    <PatientsPageClient
      patients={patients}
      activePatients={activePatients}
      patientLimit={patientLimit}
    />
  );
}
