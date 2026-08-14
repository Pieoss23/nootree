import { RecipesPageClient } from "./recipes-page-client";
import { getActiveTenant } from "@/lib/active-tenant";
import { listRecipesByTenant } from "@/modules/recipes";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const recipes = await listRecipesByTenant({ tenantId: tenant.tenantId });

  return <RecipesPageClient recipes={recipes} />;
}
