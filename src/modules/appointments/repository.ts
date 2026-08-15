import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { appointments, patients, users } from "@/db/schema";
import type { Appointment, AppointmentStatus, AppointmentWithDetails } from "./types";

/**
 * Ogni query qui prende `tenantId` esplicito e filtra per esso — stessa
 * regola di src/modules/patients/repository.ts. Vedi
 * docs/security/tenant-isolation-rules.md.
 */

function withDetails(row: {
  appointment: Appointment;
  patientFirstName: string;
  patientLastName: string;
  staffName: string | null;
  staffEmail: string;
}): AppointmentWithDetails {
  const { appointment, ...details } = row;
  return { ...appointment, ...details };
}

/** `to` esclusivo: `[from, to)`. Usata da tutte e tre le viste (agenda,
 * settimana, mese), ognuna con il proprio range calcolato in calendar.ts. */
export async function listAppointmentsByTenantInRange(input: {
  tenantId: string;
  from: Date;
  to: Date;
}): Promise<AppointmentWithDetails[]> {
  const rows = await db
    .select({
      appointment: appointments,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      staffName: users.name,
      staffEmail: users.email,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.staffUserId, users.id))
    .where(
      and(
        eq(appointments.tenantId, input.tenantId),
        gte(appointments.startsAt, input.from),
        lt(appointments.startsAt, input.to),
      ),
    )
    .orderBy(asc(appointments.startsAt));

  return rows.map(withDetails);
}

export async function getAppointmentById(input: {
  tenantId: string;
  appointmentId: string;
}): Promise<Appointment | null> {
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.tenantId, input.tenantId), eq(appointments.id, input.appointmentId)))
    .limit(1);

  return row ?? null;
}

export type AppointmentWriteFields = {
  patientId: string;
  staffUserId: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
};

export async function createAppointment(
  input: { tenantId: string } & AppointmentWriteFields,
): Promise<Appointment> {
  const [row] = await db
    .insert(appointments)
    .values({
      tenantId: input.tenantId,
      patientId: input.patientId,
      staffUserId: input.staffUserId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes,
    })
    .returning();

  return row;
}

export async function updateAppointment(
  input: { tenantId: string; appointmentId: string } & AppointmentWriteFields,
): Promise<Appointment | null> {
  const [row] = await db
    .update(appointments)
    .set({
      patientId: input.patientId,
      staffUserId: input.staffUserId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.tenantId, input.tenantId), eq(appointments.id, input.appointmentId)))
    .returning();

  return row ?? null;
}

export async function setAppointmentStatus(input: {
  tenantId: string;
  appointmentId: string;
  status: AppointmentStatus;
}): Promise<Appointment | null> {
  const [row] = await db
    .update(appointments)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(appointments.tenantId, input.tenantId), eq(appointments.id, input.appointmentId)))
    .returning();

  return row ?? null;
}

export async function deleteAppointment(input: {
  tenantId: string;
  appointmentId: string;
}): Promise<boolean> {
  const rows = await db
    .delete(appointments)
    .where(and(eq(appointments.tenantId, input.tenantId), eq(appointments.id, input.appointmentId)))
    .returning({ id: appointments.id });

  return rows.length > 0;
}
