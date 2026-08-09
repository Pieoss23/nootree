import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { patientMeasurements } from "@/db/schema";
import type { PatientMeasurement } from "./types";

/**
 * Every query here takes `tenantId` explicitly and filters by it, same rule
 * as `src/modules/patients/repository.ts` — see docs/security/tenant-isolation-rules.md.
 */

export async function listMeasurementsByPatient(input: {
  tenantId: string;
  patientId: string;
}): Promise<PatientMeasurement[]> {
  return db
    .select()
    .from(patientMeasurements)
    .where(
      and(
        eq(patientMeasurements.tenantId, input.tenantId),
        eq(patientMeasurements.patientId, input.patientId),
      ),
    )
    .orderBy(asc(patientMeasurements.measuredAt), asc(patientMeasurements.createdAt));
}

export type MeasurementWriteFields = {
  measuredAt: string;
  weightKg: number;
  heightCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  bodyFatPercent: number | null;
  bodyWaterPercent: number | null;
  leanMassKg: number | null;
  cellMassKg: number | null;
  phaseAngle: number | null;
  basalMetabolicRateKcal: number | null;
  notes: string | null;
};

export async function createMeasurement(
  input: { tenantId: string; patientId: string } & MeasurementWriteFields,
): Promise<PatientMeasurement> {
  const [row] = await db
    .insert(patientMeasurements)
    .values({
      tenantId: input.tenantId,
      patientId: input.patientId,
      measuredAt: input.measuredAt,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      waistCm: input.waistCm,
      hipCm: input.hipCm,
      armCm: input.armCm,
      bodyFatPercent: input.bodyFatPercent,
      bodyWaterPercent: input.bodyWaterPercent,
      leanMassKg: input.leanMassKg,
      cellMassKg: input.cellMassKg,
      phaseAngle: input.phaseAngle,
      basalMetabolicRateKcal: input.basalMetabolicRateKcal,
      notes: input.notes,
    })
    .returning();

  return row;
}

/** Measurements are hand-entered log rows, not anagraphic data — a mistyped
 * reading is deleted and re-added, never edited in place. */
export async function deleteMeasurement(input: {
  tenantId: string;
  patientId: string;
  measurementId: string;
}): Promise<boolean> {
  const rows = await db
    .delete(patientMeasurements)
    .where(
      and(
        eq(patientMeasurements.tenantId, input.tenantId),
        eq(patientMeasurements.patientId, input.patientId),
        eq(patientMeasurements.id, input.measurementId),
      ),
    )
    .returning({ id: patientMeasurements.id });

  return rows.length > 0;
}
