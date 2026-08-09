import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

// One pooled connection per process. In dev, Next.js hot-reloads modules, so
// the client is cached on `globalThis` to avoid exhausting the connection
// pool across reloads.
const globalForDb = globalThis as unknown as {
  queryClient?: postgres.Sql;
};

// Under `NODE_ENV=test` (set automatically by Vitest), DB integration tests
// point at TEST_DATABASE_URL instead of the development database so they
// never touch dev data. See docs/testing/milestone-01-test-strategy.md.
const connectionString =
  env.NODE_ENV === "test" && env.TEST_DATABASE_URL ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const queryClient = globalForDb.queryClient ?? postgres(connectionString);

if (env.NODE_ENV === "development") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
