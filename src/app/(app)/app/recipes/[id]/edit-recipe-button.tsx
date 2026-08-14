"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/modules/recipes/types";
import { RecipeFormDialog } from "../recipe-form-dialog";

export function EditRecipeButton({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Modifica ricetta
      </Button>
      <RecipeFormDialog mode="edit" recipe={recipe} open={open} onOpenChange={setOpen} />
    </>
  );
}
