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
// Dal file concreto, non dal barrel `@/modules/products`: quel barrel
// re-esporta anche `repository.ts` (`"server-only"`), che romperebbe il
// bundling di questo Client Component — stesso problema già noto per
// `@/modules/patients`, vedi docs/audit/open-risks.md.
import type { TenantProduct } from "@/modules/products/types";
import {
  createTenantProductAction,
  updateTenantProductAction,
  type ProductFormState,
} from "./actions";

const idleState: ProductFormState = { status: "idle" };

type ProductFormDialogProps = {
  mode: "create" | "edit";
  product?: TenantProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
};

export function ProductFormDialog({
  mode,
  product,
  open,
  onOpenChange,
  trigger,
}: ProductFormDialogProps) {
  const action = mode === "create" ? createTenantProductAction : updateTenantProductAction;
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(
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
          <DialogTitle>{mode === "create" ? "Nuovo prodotto" : "Modifica prodotto"}</DialogTitle>
          <DialogDescription>
            Valori nutrizionali sempre per 100g, per restare confrontabili con il catalogo.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} noValidate className="space-y-3">
          {mode === "edit" && product ? (
            <input type="hidden" name="productId" value={product.id} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              required
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kcalPer100g">Kcal / 100g</Label>
              <Input
                id="kcalPer100g"
                name="kcalPer100g"
                inputMode="decimal"
                defaultValue={product?.kcalPer100g ?? ""}
                required
                aria-invalid={!!state.fieldErrors?.kcalPer100g}
              />
              {state.fieldErrors?.kcalPer100g ? (
                <p className="text-xs text-destructive">{state.fieldErrors.kcalPer100g}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proteinGPer100g">Proteine g / 100g</Label>
              <Input
                id="proteinGPer100g"
                name="proteinGPer100g"
                inputMode="decimal"
                defaultValue={product?.proteinGPer100g ?? ""}
                aria-invalid={!!state.fieldErrors?.proteinGPer100g}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="carbsGPer100g">Carboidrati g / 100g</Label>
              <Input
                id="carbsGPer100g"
                name="carbsGPer100g"
                inputMode="decimal"
                defaultValue={product?.carbsGPer100g ?? ""}
                aria-invalid={!!state.fieldErrors?.carbsGPer100g}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatGPer100g">Grassi g / 100g</Label>
              <Input
                id="fatGPer100g"
                name="fatGPer100g"
                inputMode="decimal"
                defaultValue={product?.fatGPer100g ?? ""}
                aria-invalid={!!state.fieldErrors?.fatGPer100g}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fiberGPer100g">Fibre g / 100g</Label>
            <Input
              id="fiberGPer100g"
              name="fiberGPer100g"
              inputMode="decimal"
              defaultValue={product?.fiberGPer100g ?? ""}
              aria-invalid={!!state.fieldErrors?.fiberGPer100g}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" defaultValue={product?.notes ?? ""} rows={3} />
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
              {isPending ? "Salvataggio…" : mode === "create" ? "Crea prodotto" : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
