"use client";

import { useMemo, useState } from "react";
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
import type { TenantProduct } from "@/modules/products/types";
import { setTenantProductStatusAction } from "./actions";
import { ProductFormDialog } from "./product-form-dialog";

type ProductsTableProps = {
  products: TenantProduct[];
};

function ProductRowActions({ product }: { product: TenantProduct }) {
  const [editOpen, setEditOpen] = useState(false);
  const isActive = product.status === "ACTIVE";

  async function toggleStatus() {
    const formData = new FormData();
    formData.set("productId", product.id);
    formData.set("status", isActive ? "ARCHIVED" : "ACTIVE");
    await setTenantProductStatusAction(formData);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Azioni per ${product.name}`} />
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
      <ProductFormDialog mode="edit" product={product} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, query]);

  if (products.length === 0) {
    return (
      <EmptyState
        title="Nessun prodotto personalizzato"
        description="I prodotti e le ricette create da questo studio compariranno qui."
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
          aria-label="Cerca prodotti personalizzati"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Kcal/100g</TableHead>
              <TableHead>Proteine</TableHead>
              <TableHead>Carboidrati</TableHead>
              <TableHead>Grassi</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Azioni</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.kcalPer100g}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.proteinGPer100g ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.carbsGPer100g ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.fatGPer100g ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={product.status === "ACTIVE" ? "Attivo" : "Archiviato"}
                    tone={product.status === "ACTIVE" ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell>
                  <ProductRowActions product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nessun prodotto corrisponde alla ricerca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
