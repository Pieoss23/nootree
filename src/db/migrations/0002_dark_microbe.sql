CREATE TYPE "public"."food_category" AS ENUM('CEREALI_E_DERIVATI', 'VERDURA', 'FRUTTA', 'CARNE', 'PESCE', 'LATTICINI_E_UOVA', 'LEGUMI', 'GRASSI_E_OLI', 'BEVANDE', 'DOLCI_E_SNACK', 'ALTRO');--> statement-breakpoint
CREATE TYPE "public"."tenant_product_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "food_category" NOT NULL,
	"source" text DEFAULT 'CURATED_SEED' NOT NULL,
	"kcal_per_100g" numeric(6, 1) NOT NULL,
	"protein_g_per_100g" numeric(5, 1) NOT NULL,
	"carbs_g_per_100g" numeric(5, 1) NOT NULL,
	"fat_g_per_100g" numeric(5, 1) NOT NULL,
	"fiber_g_per_100g" numeric(5, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_items_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tenant_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kcal_per_100g" numeric(6, 1) NOT NULL,
	"protein_g_per_100g" numeric(5, 1),
	"carbs_g_per_100g" numeric(5, 1),
	"fat_g_per_100g" numeric(5, 1),
	"fiber_g_per_100g" numeric(5, 1),
	"notes" text,
	"status" "tenant_product_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tenant_products" ADD CONSTRAINT "tenant_products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_items_category_idx" ON "food_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tenant_products_tenant_id_idx" ON "tenant_products" USING btree ("tenant_id");