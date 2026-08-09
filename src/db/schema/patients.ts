import { pgEnum, pgTable, text, timestamp, uuid, date, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";

export const patientStatusEnum = pgEnum("patient_status", ["ACTIVE", "ARCHIVED"]);

// Deliberately minimal for Milestone 1: no clinical data (pathologies,
// anamnesis, allergies, measurements, plans, ...). See
// docs/product/milestone-01-scope.md for what is intentionally out of scope.
export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    // Intentionally not unique, even per tenant: a patient's email is not a
    // reliable identifier (shared family addresses, typos, changes).
    email: text("email"),
    phone: text("phone"),
    birthDate: date("birth_date"),
    fiscalCode: text("fiscal_code"),
    status: patientStatusEnum("status").notNull().default("ACTIVE"),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("patients_tenant_id_idx").on(table.tenantId),
    index("patients_tenant_email_idx").on(table.tenantId, table.email),
  ],
);
