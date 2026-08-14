"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/modules/recipes/types";
import { RecipeFormDialog } from "./recipe-form-dialog";
import { RecipesTable } from "./recipes-table";

type RecipesPageClientProps = {
  recipes: Recipe[];
};

export function RecipesPageClient({ recipes }: RecipesPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ricette"
        description="Ricette dello studio, composte da alimenti del catalogo e prodotti personalizzati."
        actions={
          <RecipeFormDialog
            mode="create"
            open={createOpen}
            onOpenChange={setCreateOpen}
            trigger={<Button>Nuova ricetta</Button>}
          />
        }
      />

      <RecipesTable recipes={recipes} />
    </div>
  );
}
