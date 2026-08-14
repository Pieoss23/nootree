import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveTenant } from "@/lib/active-tenant";
import { getPatientById, listMeasurementsByPatient } from "@/modules/patients";
import {
  listActiveRecipeSummariesByTenant,
  listPatientRecipes,
  computeDailyKcalTarget,
} from "@/modules/recipes";
import { EditPatientButton } from "./edit-patient-button";
import { ClinicalInfoSection } from "./clinical-info-section";
import { MeasurementsSection } from "./measurements-section";
import { MeasurementsTable } from "./measurements-table";
import { PatientRecipesSection } from "./patient-recipes-section";
import { PatientRecipesTable } from "./patient-recipes-table";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const patient = await getPatientById({ tenantId: tenant.tenantId, patientId: id });
  if (!patient) notFound();

  const [measurements, recipeSummaries, patientRecipes] = await Promise.all([
    listMeasurementsByPatient({ tenantId: tenant.tenantId, patientId: id }),
    listActiveRecipeSummariesByTenant({ tenantId: tenant.tenantId }),
    listPatientRecipes({ tenantId: tenant.tenantId, patientId: id }),
  ]);

  // Misurazioni ordinate per measuredAt crescente (vedi measurements-repository.ts) — l'ultima è la più recente.
  const latestMeasurement = measurements[measurements.length - 1] ?? null;
  const dailyTarget = computeDailyKcalTarget({
    sex: patient.sex,
    birthDate: patient.birthDate,
    activityLevel: patient.activityLevel,
    nutritionGoal: patient.nutritionGoal,
    dietIntensity: patient.dietIntensity,
    measuredBmrKcal: latestMeasurement?.basalMetabolicRateKcal ?? null,
    weightKg: latestMeasurement?.weightKg ?? null,
    heightCm: latestMeasurement?.heightCm ?? null,
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

      <Tabs defaultValue="clinical">
        <TabsList>
          <TabsTrigger value="clinical">Anamnesi e misurazioni</TabsTrigger>
          <TabsTrigger value="recipes">Ricette</TabsTrigger>
        </TabsList>

        <TabsContent value="clinical" className="space-y-6 pt-4">
          <ClinicalInfoSection patient={patient} />

          <MeasurementsSection patientId={patient.id}>
            <MeasurementsTable patientId={patient.id} measurements={measurements} />
          </MeasurementsSection>
        </TabsContent>

        <TabsContent value="recipes" className="pt-4">
          <PatientRecipesSection
            patientId={patient.id}
            recipes={recipeSummaries}
            dailyTarget={dailyTarget}
          >
            <PatientRecipesTable patientId={patient.id} patientRecipes={patientRecipes} />
          </PatientRecipesSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
