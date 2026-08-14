"use client";

import { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Imported from their concrete files, not the `@/modules/patients` barrel:
// that barrel also re-exports `repository.ts` (`"server-only"`), which would
// break bundling for this Client Component. See docs/audit/decisions.md.
import {
  NUTRITION_GOAL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  DIET_INTENSITY_OPTIONS,
} from "@/modules/patients/labels";
import type { Patient } from "@/modules/patients/types";
import { updatePatientClinicalInfoAction, type ClinicalInfoFormState } from "./actions";

const idleState: ClinicalInfoFormState = { status: "idle" };

type ClinicalInfoFormDialogProps = {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClinicalInfoFormDialog({
  patient,
  open,
  onOpenChange,
}: ClinicalInfoFormDialogProps) {
  const [state, formAction, isPending] = useActionState<ClinicalInfoFormState, FormData>(
    updatePatientClinicalInfoAction,
    idleState,
  );

  useEffect(() => {
    if (state.status === "success") onOpenChange(false);
    // Only react to the action result, not to onOpenChange identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anamnesi</DialogTitle>
          <DialogDescription>
            Dati clinici del paziente, visibili solo allo studio.
          </DialogDescription>
        </DialogHeader>
        {/* Keyed by `updatedAt` so a successful save (which changes the
        underlying patient row) remounts the Select/Checkbox fields instead of
        mutating their `defaultValue`/`defaultChecked` on an already-mounted
        instance — the latter is what triggers Base UI's uncontrolled-input
        dev warning, since this dialog stays mounted (just hidden) between
        opens. See docs/audit/decisions.md. */}
        <form
          key={patient.updatedAt.toISOString()}
          action={formAction}
          noValidate
          className="space-y-3"
        >
          <input type="hidden" name="patientId" value={patient.id} />
          <input
            type="hidden"
            name="existingConsentAt"
            value={patient.healthDataConsentAt ? patient.healthDataConsentAt.toISOString() : ""}
          />

          <div className="space-y-1.5">
            <Label htmlFor="allergiesIntolerances">Allergie / intolleranze</Label>
            <Textarea
              id="allergiesIntolerances"
              name="allergiesIntolerances"
              defaultValue={patient.allergiesIntolerances ?? ""}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pathologies">Patologie note</Label>
            <Textarea
              id="pathologies"
              name="pathologies"
              defaultValue={patient.pathologies ?? ""}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medications">Farmaci in uso</Label>
            <Textarea
              id="medications"
              name="medications"
              defaultValue={patient.medications ?? ""}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nutritionGoal">Obiettivo</Label>
              <Select name="nutritionGoal" defaultValue={patient.nutritionGoal ?? "NONE"}>
                <SelectTrigger id="nutritionGoal" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nessuno</SelectItem>
                  {NUTRITION_GOAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activityLevel">Attività fisica</Label>
              <Select name="activityLevel" defaultValue={patient.activityLevel ?? "NONE"}>
                <SelectTrigger id="activityLevel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nessuna</SelectItem>
                  {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dietIntensity">Intensità dieta</Label>
            <Select name="dietIntensity" defaultValue={patient.dietIntensity ?? "NONE"}>
              <SelectTrigger id="dietIntensity" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nessuna</SelectItem>
                {DIET_INTENSITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Influisce sul dosaggio consigliato delle ricette assegnate (solo per obiettivi di
              dimagrimento/aumento massa).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="healthDataConsent"
              name="healthDataConsent"
              defaultChecked={!!patient.healthDataConsentAt}
            />
            <Label htmlFor="healthDataConsent" className="font-normal">
              Consenso al trattamento dei dati sanitari (GDPR art. 9)
            </Label>
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
              {isPending ? "Salvataggio…" : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
