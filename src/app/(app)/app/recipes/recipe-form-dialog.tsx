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
// Dal file concreto, non dal barrel `@/modules/recipes` — stesso motivo già
// documentato per `@/modules/patients`/`@/modules/products` (il barrel
// re-esporta anche `repository.ts`, `"server-only"`).
import type { Recipe } from "@/modules/recipes/types";
import { createRecipeAction, updateRecipeAction, type RecipeFormState } from "./actions";

const idleState: RecipeFormState = { status: "idle" };

type RecipeFormDialogProps = {
  mode: "create" | "edit";
  recipe?: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function RecipeFormDialog({
  mode,
  recipe,
  open,
  onOpenChange,
  trigger,
}: RecipeFormDialogProps) {
  const action = mode === "create" ? createRecipeAction : updateRecipeAction;
  const [state, formAction, isPending] = useActionState<RecipeFormState, FormData>(
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
          <DialogTitle>{mode === "create" ? "Nuova ricetta" : "Modifica ricetta"}</DialogTitle>
          <DialogDescription>
            Gli ingredienti si aggiungono dalla pagina di dettaglio, dopo la creazione.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} noValidate className="space-y-3">
          {mode === "edit" && recipe ? (
            <input type="hidden" name="recipeId" value={recipe.id} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={recipe?.name}
              required
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions">Preparazione</Label>
            <Textarea
              id="instructions"
              name="instructions"
              defaultValue={recipe?.instructions ?? ""}
              rows={4}
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
              {isPending ? "Salvataggio…" : mode === "create" ? "Crea ricetta" : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
