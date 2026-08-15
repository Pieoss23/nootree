"use server";

import { revalidatePath } from "next/cache";
import { getActiveTenant } from "@/lib/active-tenant";
import {
  createAppointment,
  updateAppointment,
  setAppointmentStatus,
  deleteAppointment,
  appointmentFormSchema,
} from "@/modules/appointments";
import { assertFeature, FeatureNotAvailableError } from "@/modules/entitlements";
import { assertRole, InsufficientRoleError } from "@/modules/memberships";
import { recordAuditEvent } from "@/modules/audit";

/** Stessa soglia usata per le scritture pazienti/prodotti/ricette — vedi docs/audit/decisions.md. */
const MINIMUM_ROLE_FOR_APPOINTMENT_WRITES = "ASSISTANT" as const;

export type AppointmentFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"patientId" | "staffUserId" | "date" | "startTime" | "endTime", string>
  >;
};

function parseForm(formData: FormData) {
  return appointmentFormSchema.safeParse({
    patientId: formData.get("patientId"),
    staffUserId: formData.get("staffUserId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    notes: formData.get("notes"),
  });
}

function fieldErrorsFrom(
  error: ReturnType<typeof parseForm>["error"],
): AppointmentFormState["fieldErrors"] {
  if (!error) return undefined;
  const errors: AppointmentFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      errors[key as keyof NonNullable<AppointmentFormState["fieldErrors"]>] = issue.message;
    }
  }
  return errors;
}

export async function createAppointmentAction(
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
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
    assertRole(tenant.role, MINIMUM_ROLE_FOR_APPOINTMENT_WRITES);
    await assertFeature(tenant.tenantId, "appointments.management");

    const appointment = await createAppointment({ tenantId: tenant.tenantId, ...parsed.data });

    await recordAuditEvent({
      tenantId: tenant.tenantId,
      actorUserId: tenant.userId,
      action: "appointment.created",
      entityType: "appointment",
      entityId: appointment.id,
    });
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di creare appuntamenti." };
    }
    if (error instanceof FeatureNotAvailableError) {
      return { status: "error", message: "L'agenda non è inclusa nel piano attuale." };
    }
    throw error;
  }

  revalidatePath("/app/appointments");
  return { status: "success", message: "Appuntamento creato." };
}

export async function updateAppointmentAction(
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const appointmentId = formData.get("appointmentId");
  if (typeof appointmentId !== "string" || !appointmentId) {
    return { status: "error", message: "Appuntamento non valido." };
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
    assertRole(tenant.role, MINIMUM_ROLE_FOR_APPOINTMENT_WRITES);
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return { status: "error", message: "Il tuo ruolo non consente di modificare appuntamenti." };
    }
    throw error;
  }

  const appointment = await updateAppointment({
    tenantId: tenant.tenantId,
    appointmentId,
    ...parsed.data,
  });
  if (!appointment) return { status: "error", message: "Appuntamento non trovato." };

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "appointment.updated",
    entityType: "appointment",
    entityId: appointment.id,
  });

  revalidatePath("/app/appointments");
  return { status: "success", message: "Appuntamento aggiornato." };
}

export async function setAppointmentStatusAction(formData: FormData): Promise<void> {
  const appointmentId = formData.get("appointmentId");
  const status = formData.get("status");
  const validStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  if (
    typeof appointmentId !== "string" ||
    typeof status !== "string" ||
    !validStatuses.includes(status)
  ) {
    throw new Error("Invalid setAppointmentStatusAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_APPOINTMENT_WRITES);

  const appointment = await setAppointmentStatus({
    tenantId: tenant.tenantId,
    appointmentId,
    status: status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
  });
  if (!appointment) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "appointment.status_changed",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: { status: appointment.status },
  });

  revalidatePath("/app/appointments");
}

export async function deleteAppointmentAction(formData: FormData): Promise<void> {
  const appointmentId = formData.get("appointmentId");
  if (typeof appointmentId !== "string" || !appointmentId) {
    throw new Error("Invalid deleteAppointmentAction input.");
  }

  const tenant = await getActiveTenant();
  if (!tenant) return;

  assertRole(tenant.role, MINIMUM_ROLE_FOR_APPOINTMENT_WRITES);

  const deleted = await deleteAppointment({ tenantId: tenant.tenantId, appointmentId });
  if (!deleted) return;

  await recordAuditEvent({
    tenantId: tenant.tenantId,
    actorUserId: tenant.userId,
    action: "appointment.deleted",
    entityType: "appointment",
    entityId: appointmentId,
  });

  revalidatePath("/app/appointments");
}
