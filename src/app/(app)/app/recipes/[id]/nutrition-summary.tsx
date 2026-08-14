import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeNutritionTotals } from "@/modules/recipes/nutrition";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function NutritionSummary({ nutrition }: { nutrition: RecipeNutritionTotals }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Valori nutrizionali totali</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Peso totale" value={`${nutrition.totalGrams.toFixed(0)} g`} />
        <Stat label="Kcal totali" value={Math.round(nutrition.totalKcal).toString()} />
        <Stat label="Densità" value={`${nutrition.kcalPer100g.toFixed(0)} kcal/100g`} />
        <Stat label="Proteine" value={`${nutrition.totalProteinG.toFixed(1)} g`} />
        <Stat label="Carboidrati" value={`${nutrition.totalCarbsG.toFixed(1)} g`} />
        <Stat label="Grassi" value={`${nutrition.totalFatG.toFixed(1)} g`} />
        <Stat label="Fibre" value={`${nutrition.totalFiberG.toFixed(1)} g`} />
      </CardContent>
    </Card>
  );
}
