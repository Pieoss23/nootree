CREATE TYPE "public"."patient_activity_level" AS ENUM('SEDENTARY', 'LIGHT', 'MODERATE', 'INTENSE');--> statement-breakpoint
CREATE TYPE "public"."patient_nutrition_goal" AS ENUM('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MAINTENANCE', 'CLINICAL', 'OTHER');--> statement-breakpoint
CREATE TABLE "patient_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"measured_at" date NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"height_cm" numeric(5, 1),
	"waist_cm" numeric(5, 1),
	"hip_cm" numeric(5, 1),
	"arm_cm" numeric(5, 1),
	"body_fat_percent" numeric(4, 1),
	"body_water_percent" numeric(4, 1),
	"lean_mass_kg" numeric(5, 1),
	"cell_mass_kg" numeric(5, 1),
	"phase_angle" numeric(3, 1),
	"basal_metabolic_rate_kcal" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "allergies_intolerances" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "pathologies" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "medications" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "nutrition_goal" "patient_nutrition_goal";--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "activity_level" "patient_activity_level";--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "health_data_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_measurements" ADD CONSTRAINT "patient_measurements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_measurements" ADD CONSTRAINT "patient_measurements_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_measurements_tenant_id_idx" ON "patient_measurements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "patient_measurements_tenant_patient_idx" ON "patient_measurements" USING btree ("tenant_id","patient_id");