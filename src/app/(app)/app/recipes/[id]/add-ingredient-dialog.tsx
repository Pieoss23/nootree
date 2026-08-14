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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FoodItem, TenantProduct } from "@/modules/products/types";
import { addRecipeIngredientAction, type RecipeIngredientFormState } from "./actions";

const idleState: RecipeIngredientFormState = { status: "idle" };

type AddIngredientDialogProps = {
  recipeId: string;
  foodItems: FoodItem[];
  activeTenantProducts: TenantProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function AddIngredientDialog({
  recipeId,
  foodItems,
  activeTenantProducts,
  open,
  onOpenChange,
  trigger,
}: AddIngredientDialogProps) {
  const [state, formAction, isPending] = useActionState<RecipeIngredientFormState, FormData>(
    addRecipeIngredientAction,
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
          <DialogTitle>Aggiungi ingrediente</DialogTitle>
          <DialogDescription>La quantità è sempre in grammi.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} noValidate className="space-y-3">
          <input type="hidden" name="recipeId" value={recipeId} />

          <div className="space-y-1.5">
            <Label htmlFor="ingredientRef">Ingrediente</Label>
            <Select name="ingredientRef">
              <SelectTrigger id="ingredientRef" className="w-full">
                <SelectValue placeholder="Seleziona un ingrediente" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Catalogo alimenti</SelectLabel>
                  {foodItems.map((item) => (
                    <SelectItem key={item.id} value={`food:${item.id}`}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Prodotti dello studio</SelectLabel>
                  {activeTenantProducts.map((product) => (
                    <SelectItem key={product.id} value={`product:${product.id}`}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantityGrams">Quantità (g)</Label>
            <Input id="quantityGrams" name="quantityGrams" inputMode="decimal" required />
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
              {isPending ? "Aggiunta…" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
