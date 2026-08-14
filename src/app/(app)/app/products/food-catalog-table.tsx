"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared";
// Dal file concreto, non dal barrel `@/modules/products` — vedi commento in
// `product-form-dialog.tsx` sullo stesso motivo.
import type { FoodItem } from "@/modules/products/types";
import { getFoodCategoryLabel } from "@/modules/products/labels";

type FoodCatalogTableProps = {
  foodItems: FoodItem[];
};

export function FoodCatalogTable({ foodItems }: FoodCatalogTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return foodItems;
    return foodItems.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [foodItems, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca alimento…"
          className="pl-8"
          aria-label="Cerca nel catalogo alimenti"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alimento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Kcal/100g</TableHead>
              <TableHead>Proteine</TableHead>
              <TableHead>Carboidrati</TableHead>
              <TableHead>Grassi</TableHead>
              <TableHead>Fibre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell>
                  <StatusBadge label={getFoodCategoryLabel(item.category)} tone="neutral" />
                </TableCell>
                <TableCell className="text-muted-foreground">{item.kcalPer100g}</TableCell>
                <TableCell className="text-muted-foreground">{item.proteinGPer100g}</TableCell>
                <TableCell className="text-muted-foreground">{item.carbsGPer100g}</TableCell>
                <TableCell className="text-muted-foreground">{item.fatGPer100g}</TableCell>
                <TableCell className="text-muted-foreground">{item.fiberGPer100g ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nessun alimento corrisponde alla ricerca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
