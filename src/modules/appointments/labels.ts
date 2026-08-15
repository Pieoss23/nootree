import type { AppointmentStatus } from "./types";

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programmato",
  COMPLETED: "Completato",
  CANCELLED: "Annullato",
  NO_SHOW: "Non presentato",
};

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}

export const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = (
  Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]
).map((value) => ({ value, label: APPOINTMENT_STATUS_LABELS[value] }));
