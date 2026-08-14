"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, StatusBadge } from "@/components/shared";
import type { RecipeIngredientWithNutrition } from "@/modules/recipes/types";
import { removeRecipeIngredientAction } from "./actions";

type IngredientsTableProps = {
  recipeId: string;
  ingredients: RecipeIngredientWithNutrition[];
};

export function IngredientsTable({ recipeId, ingredients }: IngredientsTableProps) {
  if (ingredients.length === 0) {
    return (
      <EmptyState
        title="Nessun ingrediente"
        description="Aggiungi ingredienti dal catalogo alimenti o dai prodotti dello studio."
      />
    );
  }

  async function remove(ingredientId: string) {
    const formData = new FormData();
    formData.set("recipeId", recipeId);
    formData.set("ingredientId", ingredientId);
    await removeRecipeIngredientAction(formData);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingrediente</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Quantità (g)</TableHead>
            <TableHead>Kcal</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Azioni</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <TableRow key={ingredient.id}>
              <TableCell className="font-medium text-foreground">{ingredient.name}</TableCell>
              <TableCell>
                <StatusBadge
                  label={ingredient.source === "FOOD_ITEM" ? "Catalogo" : "Studio"}
                  tone="neutral"
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{ingredient.quantityGrams}</TableCell>
              <TableCell className="text-muted-foreground">
                {Math.round((ingredient.kcalPer100g * ingredient.quantityGrams) / 100)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Rimuovi ${ingredient.name}`}
                  onClick={() => remove(ingredient.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
