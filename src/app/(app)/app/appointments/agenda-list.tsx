"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, StatusBadge } from "@/components/shared";
import type { AppointmentWithDetails } from "@/modules/appointments/types";
import { getAppointmentStatusLabel } from "@/modules/appointments/labels";
import { setAppointmentStatusAction } from "./actions";
import {
  AppointmentFormDialog,
  type PatientOption,
  type StaffOption,
} from "./appointment-form-dialog";
import { getAppointmentStatusTone } from "./status-tone";

type AgendaListProps = {
  appointments: AppointmentWithDetails[];
  patients: PatientOption[];
  staff: StaffOption[];
};

function timeRangeLabel(appointment: AppointmentWithDetails): string {
  const format = (date: Date) =>
    date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return `${format(appointment.startsAt)} – ${format(appointment.endsAt)}`;
}

function dayHeaderLabel(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function AppointmentRowActions({
  appointment,
  patients,
  staff,
}: {
  appointment: AppointmentWithDetails;
  patients: PatientOption[];
  staff: StaffOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  async function setStatus(status: string) {
    const formData = new FormData();
    formData.set("appointmentId", appointment.id);
    formData.set("status", status);
    await setAppointmentStatusAction(formData);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Azioni appuntamento" />}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Modifica</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>
              Segna come completato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("NO_SHOW")}>
              Segna come non presentato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("CANCELLED")}>
              Segna come annullato
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AppointmentFormDialog
        mode="edit"
        appointment={appointment}
        patients={patients}
        staff={staff}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

export function AgendaList({ appointments, patients, staff }: AgendaListProps) {
  const groups = useMemo(() => {
    const byDay = new Map<string, AppointmentWithDetails[]>();
    for (const appointment of appointments) {
      const key = appointment.startsAt.toDateString();
      const existing = byDay.get(key);
      if (existing) existing.push(appointment);
      else byDay.set(key, [appointment]);
    }
    return Array.from(byDay.entries());
  }, [appointments]);

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Nessun appuntamento in questo intervallo"
        description="Naviga a un altro periodo o crea un nuovo appuntamento."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, dayAppointments]) => (
        <div key={key} className="space-y-2">
          <h3 className="text-sm font-medium capitalize text-foreground">
            {dayHeaderLabel(dayAppointments[0].startsAt)}
          </h3>
          <div className="divide-y divide-border rounded-xl border border-border">
            {dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                data-testid="appointment-row"
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {timeRangeLabel(appointment)}
                    </span>
                    <StatusBadge
                      label={getAppointmentStatusLabel(appointment.status)}
                      tone={getAppointmentStatusTone(appointment.status)}
                    />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {appointment.patientFirstName} {appointment.patientLastName} ·{" "}
                    {appointment.staffName ?? appointment.staffEmail}
                  </p>
                  {appointment.notes ? (
                    <p className="truncate text-xs text-muted-foreground">{appointment.notes}</p>
                  ) : null}
                </div>
                <AppointmentRowActions
                  appointment={appointment}
                  patients={patients}
                  staff={staff}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
