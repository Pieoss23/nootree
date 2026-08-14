import { ProductsPageClient } from "./products-page-client";
import { getActiveTenant } from "@/lib/active-tenant";
import { listFoodItems, listTenantProducts, countActiveTenantProducts } from "@/modules/products";
import { getResourceLimit } from "@/modules/entitlements";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const tenant = await getActiveTenant();
  if (!tenant) return null;

  const [foodItems, tenantProducts, activeProducts, productLimit] = await Promise.all([
    listFoodItems(),
    listTenantProducts({ tenantId: tenant.tenantId }),
    countActiveTenantProducts(tenant.tenantId),
    getResourceLimit(tenant.tenantId, "customProducts"),
  ]);

  return (
    <ProductsPageClient
      foodItems={foodItems}
      tenantProducts={tenantProducts}
      activeProducts={activeProducts}
      productLimit={productLimit}
    />
  );
}
