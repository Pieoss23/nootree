import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { getActiveTenant } from "@/lib/active-tenant";
import { getRecipeById, listRecipeIngredients, computeRecipeNutrition } from "@/modules/recipes";
import { listFoodItems, listTenantProducts } from "@/modules/products";
import { EditRecipeButton } from "./edit-recipe-button";
import { IngredientsSection } from "./ingredients-section";
import { IngredientsTable } from "./ingredients-table";
import { NutritionSummary } from "./nutrition-summary";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const recipe = await getRecipeById({ tenantId: tenant.tenantId, recipeId: id });
  if (!recipe) notFound();

  const [ingredients, foodItems, tenantProducts] = await Promise.all([
    listRecipeIngredients({ tenantId: tenant.tenantId, recipeId: id }),
    listFoodItems(),
    listTenantProducts({ tenantId: tenant.tenantId }),
  ]);

  const nutrition = computeRecipeNutrition(ingredients);
  const activeTenantProducts = tenantProducts.filter((product) => product.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <Link href="/app/recipes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Ricette
      </Link>

      <PageHeader
        title={recipe.name}
        description={recipe.instructions ?? undefined}
        actions={<EditRecipeButton recipe={recipe} />}
      />

      <NutritionSummary nutrition={nutrition} />

      <IngredientsSection
        recipeId={recipe.id}
        foodItems={foodItems}
        activeTenantProducts={activeTenantProducts}
      >
        <IngredientsTable recipeId={recipe.id} ingredients={ingredients} />
      </IngredientsSection>
    </div>
  );
}
