import "dotenv/config";
import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "stg", "prod", "test"]).default("dev"),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().default(10),
  DB_POOL_TIMEOUT: z.coerce.number().default(60000),

  // API KEY
  API_KEY: z.string().min(1),

  // WEB APP
  WEB_APP_URL: z.string().min(1),

  // AWS S3
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_REGION: z.string().min(1),
  AWS_S3_ENDPOINT: z.url().optional(),
  AWS_S3_FORCE_PATH_STYLE: z.coerce.boolean().optional().default(false),

  // MAILERSEND
  MAILERSEND_API_KEY: z.string().min(1),

  // REDIS
  REDIS_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.log("Invalid environment variables", z.treeifyError(_env.error));

  throw new Error("Invalid environment variables");
}

export const env = _env.data;
