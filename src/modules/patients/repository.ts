import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import type { Patient } from "./types";

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
