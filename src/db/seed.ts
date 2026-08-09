import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { seedDevelopmentData } from "./seed-core";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the development seed with NODE_ENV=production.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding development data...");
  const result = await seedDevelopmentData(db);

  console.log("Seed complete:");
  console.log(`  tenant: ${result.tenantName}`);
  console.log(`  owner:  ${result.ownerEmail}`);
  console.log(`  plan:   ${result.planName}`);

  await client.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
