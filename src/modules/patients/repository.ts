import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import type {
  ActivityLevel,
  DietIntensity,
  NutritionGoal,
  Patient,
  PatientSex,
  PatientStatus,
} from "./types";

/**
 * Every query here takes `tenantId` explicitly and filters by it — never
 * `getPatientById(patientId)` without a tenant, which would allow
 * cross-tenant reads. See docs/security/tenant-isolation-rules.md.
 */

export async function getPatientById(input: {
  tenantId: string;
  patientId: string;
}): Promise<Patient | null> {
  const [row] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
    .limit(1);

  return row ?? null;
}

export async function listPatientsByTenant(input: {
  tenantId: string;
  limit?: number;
}): Promise<Patient[]> {
  return db
    .select()
    .from(patients)
    .where(eq(patients.tenantId, input.tenantId))
    .orderBy(desc(patients.createdAt))
    .limit(input.limit ?? 100);
}

export async function countActivePatients(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(patients)
    .where(and(eq(patients.tenantId, tenantId), eq(patients.status, "ACTIVE")));

  return row?.value ?? 0;
}

export type PatientWriteFields = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  sex: PatientSex | null;
  fiscalCode: string | null;
  internalNotes: string | null;
};

export async function createPatient(
  input: { tenantId: string } & PatientWriteFields,
): Promise<Patient> {
  const [row] = await db
    .insert(patients)
    .values({
      tenantId: input.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      sex: input.sex,
      fiscalCode: input.fiscalCode,
      internalNotes: input.internalNotes,
    })
    .returning();

  return row;
}

export async function updatePatient(
  input: { tenantId: string; patientId: string } & PatientWriteFields,
): Promise<Patient | null> {
  const [row] = await db
    .update(patients)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      sex: input.sex,
      fiscalCode: input.fiscalCode,
      internalNotes: input.internalNotes,
      updatedAt: new Date(),
    })
    .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
    .returning();

  return row ?? null;
}

export type ClinicalWriteFields = {
  allergiesIntolerances: string | null;
  pathologies: string | null;
  medications: string | null;
  nutritionGoal: NutritionGoal | null;
  activityLevel: ActivityLevel | null;
  dietIntensity: DietIntensity | null;
  healthDataConsentAt: Date | null;
};

/** Separate from `updatePatient` on purpose: keeps the core anagrafica CRUD
 * (identity fields) untouched by clinical-data changes. */
export async function updatePatientClinicalInfo(
  input: { tenantId: string; patientId: string } & ClinicalWriteFields,
): Promise<Patient | null> {
  const [row] = await db
    .update(patients)
    .set({
      allergiesIntolerances: input.allergiesIntolerances,
      pathologies: input.pathologies,
      medications: input.medications,
      nutritionGoal: input.nutritionGoal,
      activityLevel: input.activityLevel,
      dietIntensity: input.dietIntensity,
      healthDataConsentAt: input.healthDataConsentAt,
      updatedAt: new Date(),
    })
    .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
    .returning();

  return row ?? null;
}

/** Patients are archived, never hard-deleted (clinical/anagraphic data). */
export async function setPatientStatus(input: {
  tenantId: string;
  patientId: string;
  status: PatientStatus;
}): Promise<Patient | null> {
  const [row] = await db
    .update(patients)
    .set({
      status: input.status,
      archivedAt: input.status === "ARCHIVED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(patients.tenantId, input.tenantId), eq(patients.id, input.patientId)))
    .returning();

  return row ?? null;
}
