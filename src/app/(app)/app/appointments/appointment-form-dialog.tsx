"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Dal file concreto, non dal barrel `@/modules/appointments`: quel barrel
// re-esporta anche `repository.ts` (`"server-only"`), che romperebbe il
// bundling di questo Client Component — stesso problema già noto per
// `@/modules/patients`/`@/modules/products`, vedi docs/audit/open-risks.md.
import type { AppointmentWithDetails } from "@/modules/appointments/types";
import { toIsoDateString } from "@/modules/appointments/calendar";
import { APPOINTMENT_STATUS_OPTIONS } from "@/modules/appointments/labels";
import {
  createAppointmentAction,
  updateAppointmentAction,
  setAppointmentStatusAction,
  deleteAppointmentAction,
  type AppointmentFormState,
} from "./actions";

const idleState: AppointmentFormState = { status: "idle" };

function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export type PatientOption = { id: string; label: string };
export type StaffOption = { userId: string; label: string };

type AppointmentFormDialogProps = {
  mode: "create" | "edit";
  appointment?: AppointmentWithDetails;
  patients: PatientOption[];
  staff: StaffOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
  /** Data preselezionata per una nuova creazione (es. dal giorno cliccato in griglia). */
  defaultDate?: Date;
};

export function AppointmentFormDialog({
  mode,
  appointment,
  patients,
  staff,
  open,
  onOpenChange,
  trigger,
  defaultDate,
}: AppointmentFormDialogProps) {
  const action = mode === "create" ? createAppointmentAction : updateAppointmentAction;
  const [state, formAction, isPending] = useActionState<AppointmentFormState, FormData>(
    action,
    idleState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false);
      formRef.current?.reset();
    }
    // Only react to the action result, not to onOpenChange identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleDelete() {
    if (!appointment) return;
    if (!window.confirm("Eliminare definitivamente questo appuntamento?")) return;
    const formData = new FormData();
    formData.set("appointmentId", appointment.id);
    await deleteAppointmentAction(formData);
    onOpenChange(false);
  }

  async function handleStatusChange(status: string | null) {
    if (!appointment || !status) return;
    const formData = new FormData();
    formData.set("appointmentId", appointment.id);
    formData.set("status", status);
    await setAppointmentStatusAction(formData);
  }

  const dateDefault = appointment
    ? toIsoDateString(appointment.startsAt)
    : defaultDate
      ? toIsoDateString(defaultDate)
      : toIsoDateString(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuovo appuntamento" : "Modifica appuntamento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Registra un appuntamento per un paziente."
              : "Aggiorna data, orario, paziente o note dell'appuntamento."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed by `updatedAt` per evitare il warning "uncontrolled Select"
        di Base UI quando questo dialog resta montato tra un salvataggio e
        l'altro — stesso pattern di patient-form-dialog.tsx. */}
        <form
          ref={formRef}
          key={appointment?.updatedAt.toISOString() ?? "create"}
          action={formAction}
          noValidate
          className="space-y-3"
        >
          {mode === "edit" && appointment ? (
            <input type="hidden" name="appointmentId" value={appointment.id} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="patientId">Paziente</Label>
            <Select name="patientId" defaultValue={appointment?.patientId}>
              <SelectTrigger
                id="patientId"
                className="w-full"
                aria-invalid={!!state.fieldErrors?.patientId}
              >
                <SelectValue placeholder="Seleziona un paziente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.patientId ? (
              <p className="text-xs text-destructive">{state.fieldErrors.patientId}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staffUserId">Membro dello studio</Label>
            <Select name="staffUserId" defaultValue={appointment?.staffUserId}>
              <SelectTrigger
                id="staffUserId"
                className="w-full"
                aria-invalid={!!state.fieldErrors?.staffUserId}
              >
                <SelectValue placeholder="Seleziona chi tiene l'appuntamento" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.staffUserId ? (
              <p className="text-xs text-destructive">{state.fieldErrors.staffUserId}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={dateDefault}
                required
                aria-invalid={!!state.fieldErrors?.date}
              />
              {state.fieldErrors?.date ? (
                <p className="text-xs text-destructive">{state.fieldErrors.date}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Inizio</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={appointment ? toTimeInputValue(appointment.startsAt) : "09:00"}
                required
                aria-invalid={!!state.fieldErrors?.startTime}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">Fine</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={appointment ? toTimeInputValue(appointment.endsAt) : "09:30"}
                required
                aria-invalid={!!state.fieldErrors?.endTime}
              />
              {state.fieldErrors?.endTime ? (
                <p className="text-xs text-destructive">{state.fieldErrors.endTime}</p>
              ) : null}
            </div>
          </div>

          {mode === "edit" && appointment ? (
            <div className="space-y-1.5">
              <Label htmlFor="status-select">Stato</Label>
              <Select
                defaultValue={appointment.status}
                onValueChange={(value) => handleStatusChange(value)}
              >
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" defaultValue={appointment?.notes ?? ""} rows={2} />
          </div>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Non è stato possibile salvare</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="sm:justify-between">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={handleDelete}
              >
                Elimina
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>Annulla</DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Salvataggio…"
                  : mode === "create"
                    ? "Crea appuntamento"
                    : "Salva modifiche"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
