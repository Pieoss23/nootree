import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";
import { users } from "./identity";

// Append-only at the application layer: no module should ever issue an
// UPDATE or DELETE against this table. See docs/security/tenant-isolation-rules.md.
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    requestId: text("request_id"),
    // Minimized, non-sensitive key/value context only — never raw payloads
    // or personal health data.
    metadata: jsonb("metadata"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_tenant_id_idx").on(table.tenantId),
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
  ],
);
