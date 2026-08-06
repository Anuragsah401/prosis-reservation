import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Comma-separated list of allowed origins, e.g.
  // "http://localhost:5173,http://localhost:5174,http://localhost:5175".
  // Multiple local dev ports are allowed by default since Vite silently
  // increments to the next free port (5174, 5175, ...) whenever 5173 is
  // already taken, which otherwise causes confusing CORS failures.
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Base URL of the frontend app, used to build links embedded in emails
  // (e.g. password reset links).
  APP_URL: z.string().default("http://localhost:5173"),
  // Resend (https://resend.com) is used to send transactional emails
  // (password reset, etc.). RESEND_API_KEY is optional in development —
  // when it's missing, emails are logged to the console instead of sent,
  // so local dev works without a real account.
  RESEND_API_KEY: z.string().optional(),
  // Must be a verified sender on your Resend domain/account in production.
  EMAIL_FROM: z.string().default("Prosisit Table <onboarding@resend.dev>"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration")
}

export const env = parsed.data
