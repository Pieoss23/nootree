"use client";

import { useMemo, useState } from "react";
import type { AppointmentWithDetails } from "@/modules/appointments/types";
import { getAppointmentStatusLabel } from "@/modules/appointments/labels";
import { packAppointmentsIntoLanes } from "@/modules/appointments/calendar";
import {
  AppointmentFormDialog,
  type PatientOption,
  type StaffOption,
} from "./appointment-form-dialog";
import { getAppointmentStatusTone } from "./status-tone";

const HOUR_HEIGHT_PX = 48;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;

type WeekGridProps = {
  days: Date[];
  appointments: AppointmentWithDetails[];
  patients: PatientOption[];
  staff: StaffOption[];
};

function computeHourRange(appointments: AppointmentWithDetails[]): {
  startHour: number;
  endHour: number;
} {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const appointment of appointments) {
    startHour = Math.min(startHour, appointment.startsAt.getHours());
    const endHourExclusive =
      appointment.endsAt.getMinutes() > 0
        ? appointment.endsAt.getHours() + 1
        : appointment.endsAt.getHours();
    endHour = Math.max(endHour, endHourExclusive);
  }
  return { startHour, endHour };
}

function minutesSince(date: Date, hour: number): number {
  return (date.getHours() - hour) * 60 + date.getMinutes();
}

function WeekAppointmentBlock({
  appointment,
  style,
  patients,
  staff,
}: {
  appointment: AppointmentWithDetails;
  style: React.CSSProperties;
  patients: PatientOption[];
  staff: StaffOption[];
}) {
  const [open, setOpen] = useState(false);
  const timeLabel = appointment.startsAt.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={style}
        className="absolute overflow-hidden rounded-md border border-border bg-card p-1 text-left text-xs shadow-sm hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-ring"
        data-tone={getAppointmentStatusTone(appointment.status)}
      >
        <span className="block truncate font-medium text-foreground">
          {timeLabel} {appointment.patientFirstName} {appointment.patientLastName}
        </span>
        <span className="block truncate text-muted-foreground">
          {getAppointmentStatusLabel(appointment.status)}
        </span>
      </button>
      <AppointmentFormDialog
        mode="edit"
        appointment={appointment}
        patients={patients}
        staff={staff}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function WeekGrid({ days, appointments, patients, staff }: WeekGridProps) {
  const { startHour, endHour } = useMemo(() => computeHourRange(appointments), [appointments]);
  const totalHours = endHour - startHour;
  const pxPerMinute = HOUR_HEIGHT_PX / 60;
  const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    for (const day of days) map.set(day.toDateString(), []);
    for (const appointment of appointments) {
      const key = appointment.startsAt.toDateString();
      map.get(key)?.push(appointment);
    }
    return map;
  }, [days, appointments]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="grid min-w-[720px] grid-cols-[3rem_repeat(7,1fr)]">
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="border-b border-l border-border px-2 py-2 text-center text-xs font-medium text-foreground"
          >
            <span className="block capitalize">
              {day.toLocaleDateString("it-IT", { weekday: "short" })}
            </span>
            <span className="text-muted-foreground">{day.getDate()}</span>
          </div>
        ))}

        <div className="relative" style={{ height: totalHours * HOUR_HEIGHT_PX }}>
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute right-1 text-right text-[11px] text-muted-foreground"
              style={{ top: i * HOUR_HEIGHT_PX - 6 }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayAppointments = appointmentsByDay.get(day.toDateString()) ?? [];
          const placements = packAppointmentsIntoLanes(
            dayAppointments.map((a) => ({ id: a.id, startsAt: a.startsAt, endsAt: a.endsAt })),
          );
          const placementById = new Map(placements.map((p) => [p.id, p]));

          return (
            <div
              key={day.toISOString()}
              className="relative border-l border-border"
              style={{ height: totalHours * HOUR_HEIGHT_PX }}
            >
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-border/60"
                  style={{ top: i * HOUR_HEIGHT_PX }}
                />
              ))}
              {dayAppointments.map((appointment) => {
                const placement = placementById.get(appointment.id);
                const lane = placement?.lane ?? 0;
                const laneCount = placement?.laneCount ?? 1;
                const top = minutesSince(appointment.startsAt, startHour) * pxPerMinute;
                const height = Math.max(
                  20,
                  (minutesSince(appointment.endsAt, startHour) -
                    minutesSince(appointment.startsAt, startHour)) *
                    pxPerMinute,
                );
                return (
                  <WeekAppointmentBlock
                    key={appointment.id}
                    appointment={appointment}
                    patients={patients}
                    staff={staff}
                    style={{
                      top,
                      height,
                      left: `${(lane / laneCount) * 100}%`,
                      width: `${100 / laneCount}%`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
