import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

/**
 * Never returns success when the database is unreachable — a caller relying
 * on this endpoint for readiness must be able to trust the status. No
 * connection strings, secrets, or stack traces are ever included in the
 * response.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  let databaseStatus: "up" | "down" = "down";

  try {
    await db.execute(sql`select 1`);
    databaseStatus = "up";
  } catch (error) {
    logger.error("Health check: database connectivity failed", {
      error: error instanceof Error ? error.message : "unknown error",
    });
  }

  const healthy = databaseStatus === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp,
      environment: env.NODE_ENV,
      database: databaseStatus,
    },
    { status: healthy ? 200 : 503 },
  );
}
