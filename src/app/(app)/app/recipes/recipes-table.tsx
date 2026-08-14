"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, StatusBadge } from "@/components/shared";
import type { Recipe } from "@/modules/recipes/types";
import { setRecipeStatusAction } from "./actions";
import { RecipeFormDialog } from "./recipe-form-dialog";

type RecipesTableProps = {
  recipes: Recipe[];
};

function RecipeRowActions({ recipe }: { recipe: Recipe }) {
  const [editOpen, setEditOpen] = useState(false);
  const isActive = recipe.status === "ACTIVE";

  async function toggleStatus() {
    const formData = new FormData();
    formData.set("recipeId", recipe.id);
    formData.set("status", isActive ? "ARCHIVED" : "ACTIVE");
    await setRecipeStatusAction(formData);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Azioni per ${recipe.name}`} />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Modifica</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus()}>
              {isActive ? "Archivia" : "Riattiva"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <RecipeFormDialog mode="edit" recipe={recipe} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function RecipesTable({ recipes }: RecipesTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recipes;
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(normalized));
  }, [recipes, query]);

  if (recipes.length === 0) {
    return (
      <EmptyState
        title="Nessuna ricetta"
        description="Le ricette create da questo studio compariranno qui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca per nome…"
          className="pl-8"
          aria-label="Cerca ricette"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Azioni</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/app/recipes/${recipe.id}`} className="hover:underline">
                    {recipe.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={recipe.status === "ACTIVE" ? "Attiva" : "Archiviata"}
                    tone={recipe.status === "ACTIVE" ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell>
                  <RecipeRowActions recipe={recipe} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nessuna ricetta corrisponde alla ricerca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
