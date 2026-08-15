import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails } from "@/modules/appointments/types";
import { toIsoDateString } from "@/modules/appointments/calendar";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MAX_CHIPS_PER_DAY = 3;

type MonthGridProps = {
  weeks: Date[][];
  appointments: AppointmentWithDetails[];
  referenceDate: Date;
};

export function MonthGrid({ weeks, appointments, referenceDate }: MonthGridProps) {
  const appointmentsByDay = new Map<string, AppointmentWithDetails[]>();
  for (const appointment of appointments) {
    const key = appointment.startsAt.toDateString();
    const existing = appointmentsByDay.get(key);
    if (existing) existing.push(appointment);
    else appointmentsByDay.set(key, [appointment]);
  }

  const today = new Date().toDateString();
  const currentMonth = referenceDate.getMonth();

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="grid min-w-[720px] grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-b border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {weeks.flatMap((week) =>
          week.map((day) => {
            const dayAppointments = appointmentsByDay.get(day.toDateString()) ?? [];
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = day.toDateString() === today;
            const visible = dayAppointments.slice(0, MAX_CHIPS_PER_DAY);
            const overflowCount = dayAppointments.length - visible.length;

            return (
              <Link
                key={day.toISOString()}
                href={`/app/appointments?view=agenda&date=${toIsoDateString(day)}`}
                className={cn(
                  "min-h-24 border-b border-l border-border p-1.5 text-left align-top transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs",
                    isToday && "bg-foreground font-medium text-background",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {visible.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="truncate rounded bg-muted px-1 py-0.5 text-[11px] text-foreground"
                    >
                      {appointment.startsAt.toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {appointment.patientFirstName} {appointment.patientLastName}
                    </div>
                  ))}
                  {overflowCount > 0 ? (
                    <div className="text-[11px] text-muted-foreground">+{overflowCount} altri</div>
                  ) : null}
                </div>
              </Link>
            );
          }),
        )}
      </div>
    </div>
  );
}
