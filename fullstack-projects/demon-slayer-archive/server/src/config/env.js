
import "dotenv/config";
import { z } from "zod";

// ==========================================
// ENVIRONMENT VARIABLE SCHEMA
// ==========================================

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),

  DB_HOST: z.string().min(1),

  DB_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5432),

  DB_NAME: z.string().min(1),

  DB_USER: z.string().min(1),

  DB_PASSWORD: z.string().min(1),

  TEST_DB_NAME: z.string().min(1).optional(),

  CLIENT_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:5173"),

  LOG_LEVEL: z
    .enum([
      "error",
      "warn",
      "info",
      "http",
      "verbose",
      "debug",
      "silly",
    ])
    .default("info"),
}).superRefine((data, ctx) => {
  // ========================================
  // TEST DATABASE SAFETY
  // ========================================

  if (data.NODE_ENV === "test") {
    if (!data.TEST_DB_NAME) {
      ctx.addIssue({
        code: "custom",
        path: ["TEST_DB_NAME"],
        message:
          "TEST_DB_NAME is required in the test environment",
      });

      return;
    }

    if (data.TEST_DB_NAME === data.DB_NAME) {
      ctx.addIssue({
        code: "custom",
        path: ["TEST_DB_NAME"],
        message:
          "Test database must be different from the main database",
      });
    }

    if (!data.TEST_DB_NAME.endsWith("_test")) {
      ctx.addIssue({
        code: "custom",
        path: ["TEST_DB_NAME"],
        message:
          "Test database name must end with _test",
      });
    }
  }
});

// ==========================================
// VALIDATE ENVIRONMENT VARIABLES
// ==========================================

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "\nInvalid environment configuration:\n"
  );

  for (const issue of result.error.issues) {
    console.error(
      `- ${issue.path.join(".")}: ${issue.message}`
    );
  }

  throw new Error(
    "Environment validation failed. Check your .env file."
  );
}

// ==========================================
// EXPORT VALIDATED CONFIGURATION
// ==========================================

const env = Object.freeze(result.data);

export default env;
