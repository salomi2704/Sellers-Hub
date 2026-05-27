import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:4173'),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z.enum(['true', 'false']).default('false'),
  MINIO_ACCESS_KEY: z.string().min(3),
  MINIO_SECRET_KEY: z.string().min(8),
  MINIO_BUCKET: z.string().min(3),
  WEBHOOK_MAX_SIGNATURE_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),
  WEBHOOK_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(5),
  ANALYTICS_BATCH_SIZE: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (input: Record<string, unknown>) =>
  envSchema.parse(input);
