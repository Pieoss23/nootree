import type { foodItems, tenantProducts } from "@/db/schema";

export type FoodItem = typeof foodItems.$inferSelect;
export type FoodCategory = FoodItem["category"];

export type TenantProduct = typeof tenantProducts.$inferSelect;
export type TenantProductStatus = TenantProduct["status"];
