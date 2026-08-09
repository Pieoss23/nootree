import { z } from "zod";
import { normalizeEmail, normalizeFiscalCode } from "@/lib/normalize";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const patientFormSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").max(120),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio").max(120),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || z.email().safeParse(value).success, {
      message: "Email non valida",
    })
    .transform((value) => (value ? normalizeEmail(value) : null)),
  phone: optionalTrimmed(40),
  // Native <input type="date"> value: "YYYY-MM-DD", matches the DB column.
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Data non valida",
    }),
  fiscalCode: z
    .string()
    .trim()
    .max(16)
    .optional()
    .transform((value) => (value ? value : null))
    .transform((value) => (value ? normalizeFiscalCode(value) : null)),
  internalNotes: optionalTrimmed(2000),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
