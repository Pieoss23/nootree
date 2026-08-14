CREATE TYPE "public"."platform_role" AS ENUM('USER', 'SUPERUSER');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" "platform_role" DEFAULT 'USER' NOT NULL;