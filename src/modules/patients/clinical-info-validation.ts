import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

// "NONE" is the Select sentinel for "no selection" — a native empty-string
// option value isn't reliably supported by the headless Select primitive.
const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((value) => (value && value !== "NONE" ? value : null))
    .refine((value) => value === null || (values as readonly string[]).includes(value), {
      message: "Valore non valido",
    })
    .transform((value) => value as T[number] | null);

export const clinicalInfoFormSchema = z.object({
  allergiesIntolerances: optionalTrimmed(2000),
  pathologies: optionalTrimmed(2000),
  medications: optionalTrimmed(2000),
  nutritionGoal: optionalEnum([
    "WEIGHT_LOSS",
    "WEIGHT_GAIN",
    "MAINTENANCE",
    "CLINICAL",
    "OTHER",
  ] as const),
  activityLevel: optionalEnum(["SEDENTARY", "LIGHT", "MODERATE", "INTENSE"] as const),
  dietIntensity: optionalEnum(["LIGHT", "MEDIUM", "HARD"] as const),
});

export type ClinicalInfoFormValues = z.infer<typeof clinicalInfoFormSchema>;
