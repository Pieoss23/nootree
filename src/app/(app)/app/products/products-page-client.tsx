"use client";

import { useState } from "react";
import { PageHeader, UsageMeter } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { FoodItem, TenantProduct } from "@/modules/products/types";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductsTable } from "./products-table";
import { FoodCatalogTable } from "./food-catalog-table";

type ProductsPageClientProps = {
  foodItems: FoodItem[];
  tenantProducts: TenantProduct[];
  activeProducts: number;
  productLimit: number | null;
};

export function ProductsPageClient({
  foodItems,
  tenantProducts,
  activeProducts,
  productLimit,
}: ProductsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Catalogo prodotti"
        description="Alimenti di riferimento e prodotti personalizzati dello studio."
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">Prodotti dello studio</h2>
            <p className="text-sm text-muted-foreground">
              Prodotti e ricette create da questo studio, non presenti nel catalogo generale.
            </p>
          </div>
          <ProductFormDialog
            mode="create"
            open={createOpen}
            onOpenChange={setCreateOpen}
            trigger={<Button>Nuovo prodotto</Button>}
          />
        </div>

        <div className="max-w-xs">
          <UsageMeter label="Prodotti attivi" current={activeProducts} limit={productLimit} />
        </div>

        <ProductsTable products={tenantProducts} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-foreground">Catalogo alimenti</h2>
          <p className="text-sm text-muted-foreground">
            Valori nutrizionali di riferimento per 100g, condivisi tra tutti gli studi. Sola
            consultazione.
          </p>
        </div>
        <FoodCatalogTable foodItems={foodItems} />
      </section>
    </div>
  );
}
