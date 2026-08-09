import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { getActiveTenant } from "@/lib/active-tenant";
import { getPatientById, listMeasurementsByPatient } from "@/modules/patients";
import { EditPatientButton } from "./edit-patient-button";
import { ClinicalInfoSection } from "./clinical-info-section";
import { MeasurementsSection } from "./measurements-section";
import { MeasurementsTable } from "./measurements-table";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const patient = await getPatientById({ tenantId: tenant.tenantId, patientId: id });
  if (!patient) notFound();

  const measurements = await listMeasurementsByPatient({
    tenantId: tenant.tenantId,
    patientId: id,
  });

  return (
    <div className="space-y-6">
      <Link href="/app/patients" className="text-sm text-muted-foreground hover:text-foreground">
        ← Pazienti
      </Link>

      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        description={patient.email ?? patient.phone ?? undefined}
        actions={<EditPatientButton patient={patient} />}
      />

      <ClinicalInfoSection patient={patient} />

      <MeasurementsSection patientId={patient.id}>
        <MeasurementsTable patientId={patient.id} measurements={measurements} />
      </MeasurementsSection>
    </div>
  );
}
