import { z } from "zod";

/**
 * Client-safe environment schema. Only variables prefixed with
 * `NEXT_PUBLIC_` may appear here — anything else would leak into the
 * browser bundle. Server secrets live in `env.ts` instead.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;

function loadClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid public environment configuration. Check your .env file against .env.example:\n${issues}`,
    );
  }

  return parsed.data;
}

export const clientEnv = loadClientEnv();
