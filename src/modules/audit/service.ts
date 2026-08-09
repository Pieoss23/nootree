import "server-only";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";

export type RecordAuditEventInput = {
  tenantId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestId?: string;
  /** Keep this minimal — never raw payloads or personal health data. */
  metadata?: Record<string, unknown>;
  ipHash?: string;
  userAgent?: string;
};

/**
 * Append-only by convention: this is the only function in the codebase that
 * should ever write to `audit_events`, and it never updates or deletes an
 * existing row.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  await db.insert(auditEvents).values({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    requestId: input.requestId,
    metadata: input.metadata,
    ipHash: input.ipHash,
    userAgent: input.userAgent,
  });
}
