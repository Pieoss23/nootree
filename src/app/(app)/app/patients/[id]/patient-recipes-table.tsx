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
import type { PatientRecipeWithRecipe } from "@/modules/recipes/types";
import { removePatientRecipeAction } from "./actions";

export function PatientRecipesTable({
  patientId,
  patientRecipes,
}: {
  patientId: string;
  patientRecipes: PatientRecipeWithRecipe[];
}) {
  if (patientRecipes.length === 0) {
    return (
      <EmptyState
        title="Nessuna ricetta assegnata"
        description="Le ricette assegnate a questo paziente compariranno qui."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ricetta</TableHead>
            <TableHead>Porzione</TableHead>
            <TableHead>Suggerita</TableHead>
            <TableHead>Assegnata il</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Azioni</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...patientRecipes].reverse().map((patientRecipe) => (
            <TableRow key={patientRecipe.id}>
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  {patientRecipe.recipeName}
                  {patientRecipe.recipeStatus === "ARCHIVED" ? (
                    <StatusBadge label="Archiviata" tone="neutral" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{patientRecipe.portionGrams} g</TableCell>
              <TableCell className="text-muted-foreground">
                {patientRecipe.suggestedPortionGrams !== null
                  ? `${patientRecipe.suggestedPortionGrams} g`
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {patientRecipe.assignedAt.toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {patientRecipe.notes ?? "—"}
              </TableCell>
              <TableCell>
                <form action={removePatientRecipeAction}>
                  <input type="hidden" name="patientId" value={patientId} />
                  <input type="hidden" name="patientRecipeId" value={patientRecipe.id} />
                  <Button type="submit" variant="ghost" size="icon-sm" aria-label="Rimuovi ricetta">
                    ×
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
