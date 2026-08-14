"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
import type { RecipeSummary } from "@/modules/recipes/types";
// Dal file concreto, non dal barrel `@/modules/recipes` — stesso motivo già
// documentato altrove (il barrel re-esporta anche `repository.ts`, `"server-only"`).
import { suggestRecipePortionGrams, type DailyTargetResult } from "@/modules/recipes/dosage";
import { assignRecipeToPatientAction, type AssignRecipeFormState } from "./actions";

const idleState: AssignRecipeFormState = { status: "idle" };

type AssignRecipeDialogProps = {
  patientId: string;
  recipes: RecipeSummary[];
  dailyTarget: DailyTargetResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function AssignRecipeDialog({
  patientId,
  recipes,
  dailyTarget,
  open,
  onOpenChange,
  trigger,
}: AssignRecipeDialogProps) {
  const [state, formAction, isPending] = useActionState<AssignRecipeFormState, FormData>(
    assignRecipeToPatientAction,
    idleState,
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [portionGrams, setPortionGrams] = useState<string>("");

  // Local selection/portion reset only on a real close event (cancel/escape/
  // overlay-click), not from the effect below — calling a `useState` setter
  // directly inside a bare effect trips `react-hooks/set-state-in-effect`.
  // A successful submit still closes the dialog (via the plain `onOpenChange`
  // prop in the effect) without forcing this reset, so the last assignment
  // stays visible if reopened — harmless, and avoids fighting the lint rule
  // for a cosmetic reset.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedRecipeId("");
      setPortionGrams("");
    }
    onOpenChange(nextOpen);
  }

  useEffect(() => {
    if (state.status === "success") onOpenChange(false);
    // Only react to the action result, not to onOpenChange identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);

  const suggestedPortionGrams = useMemo(() => {
    if (!selectedRecipe || dailyTarget.status !== "ok") return null;
    return suggestRecipePortionGrams(dailyTarget.dailyKcalTarget, selectedRecipe.kcalPer100g);
  }, [selectedRecipe, dailyTarget]);

  function handleRecipeChange(recipeId: string | null) {
    setSelectedRecipeId(recipeId ?? "");
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe && dailyTarget.status === "ok") {
      const suggestion = suggestRecipePortionGrams(dailyTarget.dailyKcalTarget, recipe.kcalPer100g);
      if (suggestion !== null) setPortionGrams(suggestion.toFixed(0));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assegna ricetta</DialogTitle>
          <DialogDescription>
            La porzione è sempre modificabile: il valore proposto è solo un suggerimento.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} noValidate className="space-y-3">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="suggestedPortionGrams" value={suggestedPortionGrams ?? ""} />

          <div className="space-y-1.5">
            <Label htmlFor="recipeId">Ricetta</Label>
            <Select name="recipeId" value={selectedRecipeId} onValueChange={handleRecipeChange}>
              <SelectTrigger id="recipeId" className="w-full">
                <SelectValue placeholder="Seleziona una ricetta" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dailyTarget.status === "insufficient_data" ? (
            <p className="text-xs text-muted-foreground">
              Dosaggio suggerito non disponibile: dati mancanti ({dailyTarget.missing.join(", ")}).
              Inserisci la porzione manualmente.
            </p>
          ) : selectedRecipe && suggestedPortionGrams !== null ? (
            <p className="text-xs text-muted-foreground">
              Porzione suggerita in base al fabbisogno stimato del paziente:{" "}
              {suggestedPortionGrams.toFixed(0)} g. Puoi modificarla liberamente.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="portionGrams">Porzione (g)</Label>
            <Input
              id="portionGrams"
              name="portionGrams"
              inputMode="decimal"
              required
              value={portionGrams}
              onChange={(event) => setPortionGrams(event.target.value)}
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
            <Button type="submit" disabled={isPending || !selectedRecipeId}>
              {isPending ? "Assegnazione…" : "Assegna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
