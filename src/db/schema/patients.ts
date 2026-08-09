import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  numeric,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";

export const patientStatusEnum = pgEnum("patient_status", ["ACTIVE", "ARCHIVED"]);

// Categorical clinical fields — see docs/audit/decisions.md (voce "Anagrafica
// clinica pazienti + misurazioni") for why these are enums and not free text.
export const patientNutritionGoalEnum = pgEnum("patient_nutrition_goal", [
  "WEIGHT_LOSS",
  "WEIGHT_GAIN",
  "MAINTENANCE",
  "CLINICAL",
  "OTHER",
]);

export const patientActivityLevelEnum = pgEnum("patient_activity_level", [
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "INTENSE",
]);

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
    // Clinical/anamnesis fields, all optional: not every patient has this
    // filled in yet, and it's entered over time during visits, not at
    // creation. See docs/audit/decisions.md.
    allergiesIntolerances: text("allergies_intolerances"),
    pathologies: text("pathologies"),
    medications: text("medications"),
    nutritionGoal: patientNutritionGoalEnum("nutrition_goal"),
    activityLevel: patientActivityLevelEnum("activity_level"),
    // GDPR art. 9 special-category consent for storing health data. `null` =
    // no consent on record (not "denied" — just not yet asked/given).
    healthDataConsentAt: timestamp("health_data_consent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("patients_tenant_id_idx").on(table.tenantId),
    index("patients_tenant_email_idx").on(table.tenantId, table.email),
  ],
);

/**
 * One row per weigh-in/visit. `measuredAt` is the clinical date (may be
 * backfilled by the nutritionist), distinct from `createdAt` (insertion
 * time) — "first"/"most recent" measurement is always by `measuredAt`.
 * All anthropometric/BIA fields besides `weightKg` are optional: not every
 * studio has a bioimpedance scale, and not every visit re-measures everything.
 * Numeric columns use Postgres `numeric` with `mode: "number"` (exact decimal
 * storage, plain JS number in code) — different from the integer-minor-units
 * pattern used for money in billing.ts, because these values are displayed/
 * charted, never summed or multiplied. See docs/audit/decisions.md.
 */
export const patientMeasurements = pgTable(
  "patient_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    measuredAt: date("measured_at").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1, mode: "number" }).notNull(),
    heightCm: numeric("height_cm", { precision: 5, scale: 1, mode: "number" }),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1, mode: "number" }),
    hipCm: numeric("hip_cm", { precision: 5, scale: 1, mode: "number" }),
    armCm: numeric("arm_cm", { precision: 5, scale: 1, mode: "number" }),
    bodyFatPercent: numeric("body_fat_percent", { precision: 4, scale: 1, mode: "number" }),
    bodyWaterPercent: numeric("body_water_percent", { precision: 4, scale: 1, mode: "number" }),
    leanMassKg: numeric("lean_mass_kg", { precision: 5, scale: 1, mode: "number" }),
    cellMassKg: numeric("cell_mass_kg", { precision: 5, scale: 1, mode: "number" }),
    phaseAngle: numeric("phase_angle", { precision: 3, scale: 1, mode: "number" }),
    basalMetabolicRateKcal: integer("basal_metabolic_rate_kcal"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("patient_measurements_tenant_id_idx").on(table.tenantId),
    index("patient_measurements_tenant_patient_idx").on(table.tenantId, table.patientId),
  ],
);
