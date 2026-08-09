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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient } from "@/modules/patients";
import { createPatientAction, updatePatientAction, type PatientFormState } from "./actions";

const idleState: PatientFormState = { status: "idle" };

type PatientFormDialogProps = {
  mode: "create" | "edit";
  patient?: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function PatientFormDialog({
  mode,
  patient,
  open,
  onOpenChange,
  trigger,
}: PatientFormDialogProps) {
  const action = mode === "create" ? createPatientAction : updatePatientAction;
  const [state, formAction, isPending] = useActionState<PatientFormState, FormData>(
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nuovo paziente" : "Modifica paziente"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Aggiungi un paziente all'anagrafica dello studio."
              : "Aggiorna i dati anagrafici del paziente."}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} noValidate className="space-y-3">
          {mode === "edit" && patient ? (
            <input type="hidden" name="patientId" value={patient.id} />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={patient?.firstName}
                required
                aria-invalid={!!state.fieldErrors?.firstName}
              />
              {state.fieldErrors?.firstName ? (
                <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={patient?.lastName}
                required
                aria-invalid={!!state.fieldErrors?.lastName}
              />
              {state.fieldErrors?.lastName ? (
                <p className="text-xs text-destructive">{state.fieldErrors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={patient?.email ?? ""}
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email ? (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" defaultValue={patient?.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Data di nascita</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={patient?.birthDate ?? ""}
                aria-invalid={!!state.fieldErrors?.birthDate}
              />
              {state.fieldErrors?.birthDate ? (
                <p className="text-xs text-destructive">{state.fieldErrors.birthDate}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fiscalCode">Codice fiscale</Label>
            <Input
              id="fiscalCode"
              name="fiscalCode"
              defaultValue={patient?.fiscalCode ?? ""}
              className="uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="internalNotes">Note interne</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={patient?.internalNotes ?? ""}
              rows={3}
            />
          </div>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertTitle>Non è stato possibile salvare</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Annulla</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : mode === "create" ? "Crea paziente" : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
