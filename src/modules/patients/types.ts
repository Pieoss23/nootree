import type { patients, patientMeasurements } from "@/db/schema";

export type Patient = typeof patients.$inferSelect;
export type PatientStatus = Patient["status"];
export type PatientSex = NonNullable<Patient["sex"]>;
export type NutritionGoal = NonNullable<Patient["nutritionGoal"]>;
export type ActivityLevel = NonNullable<Patient["activityLevel"]>;
export type DietIntensity = NonNullable<Patient["dietIntensity"]>;

export type PatientMeasurement = typeof patientMeasurements.$inferSelect;
