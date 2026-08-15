import { pgEnum, pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";
import { patients } from "./patients";
import { users } from "./identity";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

// staffUserId references users.id directly (not a membership row): the app
// doesn't hard-delete memberships today, and the calendar just needs "which
// staff member" for display/grouping, not a strict "must currently have an
// active membership" DB constraint (enforced at the application layer when
// populating the staff picker — see src/modules/appointments/repository.ts).
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("SCHEDULED"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointments_tenant_id_idx").on(table.tenantId),
    // Range queries (agenda/settimana/mese) filtrano sempre per tenant +
    // finestra temporale — vedi listAppointmentsByTenantInRange.
    index("appointments_tenant_starts_at_idx").on(table.tenantId, table.startsAt),
    index("appointments_tenant_patient_idx").on(table.tenantId, table.patientId),
  ],
);
