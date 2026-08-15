import type { StatusTone } from "@/components/shared";
import type { AppointmentStatus } from "@/modules/appointments/types";

const STATUS_TONES: Record<AppointmentStatus, StatusTone> = {
  SCHEDULED: "neutral",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

export function getAppointmentStatusTone(status: AppointmentStatus): StatusTone {
  return STATUS_TONES[status];
}
