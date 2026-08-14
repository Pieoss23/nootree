"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecipeSummary } from "@/modules/recipes/types";
import type { DailyTargetResult } from "@/modules/recipes/dosage";
import { AssignRecipeDialog } from "./assign-recipe-dialog";

export function PatientRecipesSection({
  patientId,
  recipes,
  dailyTarget,
  children,
}: {
  patientId: string;
  recipes: RecipeSummary[];
  dailyTarget: DailyTargetResult;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Ricette assegnate</CardTitle>
          <CardDescription>
            {dailyTarget.status === "ok"
              ? `Fabbisogno giornaliero stimato: ${Math.round(dailyTarget.dailyKcalTarget)} kcal (${dailyTarget.bmrSource === "MEASURED" ? "BMR misurato" : "BMR stimato"}).`
              : "Fabbisogno giornaliero non calcolabile — dati insufficienti."}
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={recipes.length === 0}>
          Assegna ricetta
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <AssignRecipeDialog
        patientId={patientId}
        recipes={recipes}
        dailyTarget={dailyTarget}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}
