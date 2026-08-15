import type { appointments } from "@/db/schema";

export type Appointment = typeof appointments.$inferSelect;
export type AppointmentStatus = Appointment["status"];

export type AppointmentWithDetails = Appointment & {
  patientFirstName: string;
  patientLastName: string;
  staffName: string | null;
  staffEmail: string;
};
