"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  updatePatientClinicalInfo,
  createMeasurement,
  deleteMeasurement,
  clinicalInfoFormSchema,
  measurementFormSchema,
  type ClinicalInfoFormValues,
  type MeasurementFormValues,
} from "@/modules/patients";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

const MINIMUM_ROLE_FOR_PATIENT_WRITES = "ASSISTANT" as const;

export type ClinicalInfoFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ClinicalInfoFormValues, string>>;
};

export type MeasurementFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof MeasurementFormValues, string>>;
};

function fieldErrorsFrom<Values extends Record<string, unknown>>(
  error: { issues: { path: PropertyKey[]; message: string }[] } | undefined,
): Partial<Record<keyof Values, string>> | undefined {
  if (!error) return undefined;
  const errors: Partial<Record<keyof Values, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") errors[key as keyof Values] = issue.message;
  }
  return errors;
}

export async function updatePatientClinicalInfoAction(
  _prevState: ClinicalInfoFormState,
  formData: FormData,
): Promise<ClinicalInfoFormState> {
  const patientId = formData.get("patientId");
  if (typeof patientId !== "string" || !patientId) {
    return { status: "error", message: "Paziente non valido." };
  }

  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare l'anamnesi." };
    }
    throw error;
  }

  const parsed = clinicalInfoFormSchema.safeParse({
    allergiesIntolerances: formData.get("allergiesIntolerances"),
    pathologies: formData.get("pathologies"),
    medications: formData.get("medications"),
    nutritionGoal: formData.get("nutritionGoal"),
    activityLevel: formData.get("activityLevel"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom<ClinicalInfoFormValues>(parsed.error),
    };
  }

  // Consent timestamp is meant to record *when consent was granted*, not
  // "when this form was last saved" — see docs/audit/decisions.md.
  const consentChecked = formData.get("healthDataConsent") === "on";
  const existingConsentAt = formData.get("existingConsentAt");
  const healthDataConsentAt = consentChecked
    ? typeof existingConsentAt === "string" && existingConsentAt
      ? new Date(existingConsentAt)
      : new Date()
    : null;

  const patient = await updatePatientClinicalInfo({
    tenantId: tenant.tenantId,
    patientId,
    ...parsed.data,
    healthDataConsentAt,
  });
  if (!patient) return { status: "error", message: "Paziente non trovato." };

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "patient.clinical_info_updated",
    entityType: "patient",
    entityId: patient.id,
  });

  revalidatePath(`/app/patients/${patientId}`);
  return { status: "success", message: "Anamnesi aggiornata." };
}

export async function createMeasurementAction(
  _prevState: MeasurementFormState,
  formData: FormData,
): Promise<MeasurementFormState> {
  const patientId = formData.get("patientId");
  if (typeof patientId !== "string" || !patientId) {
    return { status: "error", message: "Paziente non valido." };
  }

  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di aggiungere misurazioni." };
    }
    throw error;
  }

  const parsed = measurementFormSchema.safeParse({
    measuredAt: formData.get("measuredAt"),
    weightKg: formData.get("weightKg"),
    heightCm: formData.get("heightCm"),
    waistCm: formData.get("waistCm"),
    hipCm: formData.get("hipCm"),
    armCm: formData.get("armCm"),
    bodyFatPercent: formData.get("bodyFatPercent"),
    bodyWaterPercent: formData.get("bodyWaterPercent"),
    leanMassKg: formData.get("leanMassKg"),
    cellMassKg: formData.get("cellMassKg"),
    phaseAngle: formData.get("phaseAngle"),
    basalMetabolicRateKcal: formData.get("basalMetabolicRateKcal"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom<MeasurementFormValues>(parsed.error),
    };
  }

  const measurement = await createMeasurement({
    tenantId: tenant.tenantId,
    patientId,
    ...parsed.data,
    basalMetabolicRateKcal:
      parsed.data.basalMetabolicRateKcal === null
        ? null
        : Math.round(parsed.data.basalMetabolicRateKcal),
  });

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "patient.measurement_added",
    entityType: "patient_measurement",
    entityId: measurement.id,
  });

  revalidatePath(`/app/patients/${patientId}`);
  return { status: "success", message: "Misurazione registrata." };
}

export async function deleteMeasurementAction(formData: FormData): Promise<void> {
  const patientId = formData.get("patientId");
  const measurementId = formData.get("measurementId");
  if (typeof patientId !== "string" || typeof measurementId !== "string") {
    throw new Error("Invalid deleteMeasurementAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);

  const deleted = await deleteMeasurement({ tenantId: tenant.tenantId, patientId, measurementId });
  if (!deleted) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "patient.measurement_deleted",
    entityType: "patient_measurement",
    entityId: measurementId,
  });

  revalidatePath(`/app/patients/${patientId}`);
}
