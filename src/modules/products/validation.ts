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

/** Valori sempre per 100g — vedi src/db/schema/products.ts. */
export const tenantProductFormSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(160),
  kcalPer100g: requiredNumber(0, 900),
  proteinGPer100g: optionalNumber(0, 100),
  carbsGPer100g: optionalNumber(0, 100),
  fatGPer100g: optionalNumber(0, 100),
  fiberGPer100g: optionalNumber(0, 100),
  notes: optionalTrimmed(2000),
});

export type TenantProductFormValues = z.infer<typeof tenantProductFormSchema>;
