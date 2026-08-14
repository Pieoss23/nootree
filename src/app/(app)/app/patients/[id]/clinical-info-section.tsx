"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Imported from their concrete files, not the `@/modules/patients` barrel:
// that barrel also re-exports `repository.ts` (`"server-only"`), which would
// break bundling for this Client Component. See docs/audit/decisions.md.
import {
  getActivityLevelLabel,
  getDietIntensityLabel,
  getNutritionGoalLabel,
} from "@/modules/patients/labels";
import type { Patient } from "@/modules/patients/types";
import { ClinicalInfoFormDialog } from "./clinical-info-form-dialog";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value ?? "—"}</p>
    </div>
  );
}

export function ClinicalInfoSection({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Anamnesi</CardTitle>
          <CardDescription>Allergie, patologie, farmaci, obiettivo.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Modifica
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Allergie / intolleranze" value={patient.allergiesIntolerances} />
        <Field label="Patologie note" value={patient.pathologies} />
        <Field label="Farmaci in uso" value={patient.medications} />
        <Field
          label="Obiettivo"
          value={patient.nutritionGoal ? getNutritionGoalLabel(patient.nutritionGoal) : null}
        />
        <Field
          label="Attività fisica"
          value={patient.activityLevel ? getActivityLevelLabel(patient.activityLevel) : null}
        />
        <Field
          label="Intensità dieta"
          value={patient.dietIntensity ? getDietIntensityLabel(patient.dietIntensity) : null}
        />
        <Field
          label="Consenso dati sanitari"
          value={
            patient.healthDataConsentAt
              ? `Registrato il ${patient.healthDataConsentAt.toLocaleDateString("it-IT")}`
              : "Non registrato"
          }
        />
      </CardContent>
      <ClinicalInfoFormDialog patient={patient} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
