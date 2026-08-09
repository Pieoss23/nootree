import { z } from "zod";

const requiredNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obbligatorio")
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(z.number().min(min).max(max));

const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .transform((value) => (value === null ? null : Number(value.replace(",", "."))))
    .refine((value) => value === null || (!Number.isNaN(value) && value >= min && value <= max), {
      message: "Valore non valido",
    });

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const measurementFormSchema = z.object({
  // Native <input type="date"> value: "YYYY-MM-DD", matches the DB column.
  measuredAt: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), { message: "Data non valida" }),
  weightKg: requiredNumber(0, 500),
  heightCm: optionalNumber(0, 250),
  waistCm: optionalNumber(0, 300),
  hipCm: optionalNumber(0, 300),
  armCm: optionalNumber(0, 100),
  bodyFatPercent: optionalNumber(0, 100),
  bodyWaterPercent: optionalNumber(0, 100),
  leanMassKg: optionalNumber(0, 500),
  cellMassKg: optionalNumber(0, 500),
  phaseAngle: optionalNumber(0, 20),
  basalMetabolicRateKcal: optionalNumber(0, 10000),
  notes: optionalTrimmed(2000),
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;
