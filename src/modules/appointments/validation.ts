import { z } from "zod";

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Orario non valido (HH:MM)");

/**
 * `date`/`startTime`/`endTime` sono campi separati nel form (`<input
 * type="date">` + due `type="time">`), combinati qui in `Date` reali.
 * Nessuna gestione di fusi orari multipli: l'app non ne ha altrove (lo
 * studio e il server operano nello stesso fuso, l'orario inserito è preso
 * per come scritto — stessa semplificazione implicita di ogni altro campo
 * data/ora del progetto).
 */
export const appointmentFormSchema = z
  .object({
    patientId: z.string().trim().min(1, "Seleziona un paziente"),
    staffUserId: z.string().trim().min(1, "Seleziona un membro dello studio"),
    date: z.string().trim().min(1, "Seleziona una data"),
    startTime: timeString,
    endTime: timeString,
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .transform((data) => ({
    patientId: data.patientId,
    staffUserId: data.staffUserId,
    startsAt: new Date(`${data.date}T${data.startTime}:00`),
    endsAt: new Date(`${data.date}T${data.endTime}:00`),
    notes: data.notes,
  }))
  .refine(
    (data) => !Number.isNaN(data.startsAt.getTime()) && !Number.isNaN(data.endsAt.getTime()),
    { message: "Data o orario non validi", path: ["date"] },
  )
  .refine((data) => data.endsAt.getTime() > data.startsAt.getTime(), {
    message: "L'orario di fine deve essere successivo a quello di inizio",
    path: ["endTime"],
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
