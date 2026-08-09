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
import { createMeasurementAction, type MeasurementFormState } from "./actions";

const idleState: MeasurementFormState = { status: "idle" };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type NumberFieldProps = {
  id: string;
  label: string;
  step?: string;
  required?: boolean;
  error?: string;
};

function NumberField({ id, label, step = "0.1", required, error }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        step={step}
        min={0}
        required={required}
        aria-invalid={!!error}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

type MeasurementFormDialogProps = {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function MeasurementFormDialog({
  patientId,
  open,
  onOpenChange,
  trigger,
}: MeasurementFormDialogProps) {
  const [state, formAction, isPending] = useActionState<MeasurementFormState, FormData>(
    createMeasurementAction,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuova misurazione</DialogTitle>
          <DialogDescription>
            Peso obbligatorio; altezza, circonferenze e dati BIA opzionali.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} noValidate className="space-y-3">
          <input type="hidden" name="patientId" value={patientId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="measuredAt">Data</Label>
              <Input
                id="measuredAt"
                name="measuredAt"
                type="date"
                defaultValue={todayIsoDate()}
                required
                aria-invalid={!!state.fieldErrors?.measuredAt}
              />
              {state.fieldErrors?.measuredAt ? (
                <p className="text-xs text-destructive">{state.fieldErrors.measuredAt}</p>
              ) : null}
            </div>
            <NumberField
              id="weightKg"
              label="Peso (kg)"
              required
              error={state.fieldErrors?.weightKg}
            />
          </div>

          <NumberField
            id="heightCm"
            label="Altezza (cm)"
            step="0.1"
            error={state.fieldErrors?.heightCm}
          />

          <p className="text-xs font-medium text-muted-foreground">Circonferenze (cm)</p>
          <div className="grid grid-cols-3 gap-3">
            <NumberField id="waistCm" label="Vita" error={state.fieldErrors?.waistCm} />
            <NumberField id="hipCm" label="Fianchi" error={state.fieldErrors?.hipCm} />
            <NumberField id="armCm" label="Braccio" error={state.fieldErrors?.armCm} />
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            Dati BIA (bioimpedenziometro, opzionali)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="bodyFatPercent"
              label="Massa grassa (%)"
              error={state.fieldErrors?.bodyFatPercent}
            />
            <NumberField
              id="bodyWaterPercent"
              label="Acqua corporea (%)"
              error={state.fieldErrors?.bodyWaterPercent}
            />
            <NumberField
              id="leanMassKg"
              label="Massa magra (kg)"
              error={state.fieldErrors?.leanMassKg}
            />
            <NumberField
              id="cellMassKg"
              label="Massa cellulare (kg)"
              error={state.fieldErrors?.cellMassKg}
            />
            <NumberField
              id="phaseAngle"
              label="Angolo di fase (°)"
              error={state.fieldErrors?.phaseAngle}
            />
            <NumberField
              id="basalMetabolicRateKcal"
              label="Metabolismo basale (kcal)"
              step="1"
              error={state.fieldErrors?.basalMetabolicRateKcal}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" rows={2} />
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
              {isPending ? "Salvataggio…" : "Aggiungi misurazione"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
