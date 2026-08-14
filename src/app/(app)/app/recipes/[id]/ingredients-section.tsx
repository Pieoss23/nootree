"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FoodItem, TenantProduct } from "@/modules/products/types";
import { AddIngredientDialog } from "./add-ingredient-dialog";

export function IngredientsSection({
  recipeId,
  foodItems,
  activeTenantProducts,
  children,
}: {
  recipeId: string;
  foodItems: FoodItem[];
  activeTenantProducts: TenantProduct[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Ingredienti</CardTitle>
          <CardDescription>Composizione della ricetta, quantità in grammi.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Aggiungi ingrediente
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <AddIngredientDialog
        recipeId={recipeId}
        foodItems={foodItems}
        activeTenantProducts={activeTenantProducts}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}
