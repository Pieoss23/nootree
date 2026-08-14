"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  createPatient,
  updatePatient,
  setPatientStatus,
  countActivePatients,
  patientFormSchema,
  type PatientWriteFields,
} from "@/modules/patients";
import {
  assertFeature,
  assertWithinLimit,
  FeatureNotAvailableError,
  ResourceLimitExceededError,
} from "@/modules/entitlements";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

/** Every membership role can manage patients; the check exists so this stays an explicit, tested boundary as roles diverge for other actions. */
const MINIMUM_ROLE_FOR_PATIENT_WRITES = "ASSISTANT" as const;

export type PatientFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof PatientWriteFields, string>>;
};

function parseForm(formData: FormData) {
  return patientFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    sex: formData.get("sex"),
    fiscalCode: formData.get("fiscalCode"),
    internalNotes: formData.get("internalNotes"),
  });
}

function fieldErrorsFrom(
  error: ReturnType<typeof parseForm>["error"],
): PatientFormState["fieldErrors"] {
  if (!error) return undefined;
  const errors: PatientFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") errors[key as keyof PatientWriteFields] = issue.message;
  }
  return errors;
}

export async function createPatientAction(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);
    await assertFeature(tenant.tenantId, "patients.management");
    const activePatients = await countActivePatients(tenant.tenantId);
    await assertWithinLimit(tenant.tenantId, "activePatients", activePatients);

    const patient = await createPatient({ tenantId: tenant.tenantId, ...parsed.data });

    await recordAuditEvent({
      tenantId: tenant.tenantId,
      actorUserId: tenant.userId,
      action: "patient.created",
      entityType: "patient",
      entityId: patient.id,
    });
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di creare pazienti." };
    }
    if (error instanceof ResourceLimitExceededError) {
      return {
        status: "error",
        message: `Limite pazienti attivi raggiunto (${error.current}/${error.limit}) per il piano attuale.`,
      };
    }
    if (error instanceof FeatureNotAvailableError) {
      return { status: "error", message: "La gestione pazienti non è inclusa nel piano attuale." };
    }
    throw error;
  }

  revalidatePath("/app/patients");
  return { status: "success", message: "Paziente creato." };
}

export async function updatePatientAction(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const patientId = formData.get("patientId");
  if (typeof patientId !== "string" || !patientId) {
    return { status: "error", message: "Paziente non valido." };
  }

  const tenant = await getActiveTenant();
  if (!tenant) return { status: "error", message: "Nessuno studio associato al tuo account." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare pazienti." };
    }
    throw error;
  }

  const patient = await updatePatient({ tenantId: tenant.tenantId, patientId, ...parsed.data });
  if (!patient) return { status: "error", message: "Paziente non trovato." };

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "patient.updated",
    entityType: "patient",
    entityId: patient.id,
  });

  revalidatePath("/app/patients");
  return { status: "success", message: "Paziente aggiornato." };
}

export async function setPatientStatusAction(formData: FormData): Promise<void> {
  const patientId = formData.get("patientId");
  const status = formData.get("status");
  if (typeof patientId !== "string" || (status !== "ACTIVE" && status !== "ARCHIVED")) {
    throw new Error("Invalid setPatientStatusAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_PATIENT_WRITES);

  const patient = await setPatientStatus({ tenantId: tenant.tenantId, patientId, status });
  if (!patient) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: status === "ARCHIVED" ? "patient.archived" : "patient.reactivated",
    entityType: "patient",
    entityId: patient.id,
  });

  revalidatePath("/app/patients");
}
