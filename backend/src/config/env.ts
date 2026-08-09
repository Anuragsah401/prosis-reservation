import "dotenv/config"
import { z } from "zod"

const envSchema = z
  .object({
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
    // Base URL of the frontend app, used to build links embedded in emails and
    // SMS (password reset, reservation confirmation). The localhost default is
    // for local dev only — in production this MUST be set to the public site
    // URL, otherwise customers receive links pointing at localhost. That is
    // enforced below rather than left to convention, because the failure is
    // silent: the email sends successfully, it's just unusable.
    APP_URL: z.string().default("http://localhost:5173"),
    // Resend (https://resend.com) is used to send transactional emails
    // (password reset, etc.). RESEND_API_KEY is optional in development —
    // when it's missing, emails are logged to the console instead of sent,
    // so local dev works without a real account.
    RESEND_API_KEY: z.string().optional(),
    // Must be a verified sender on your Resend domain/account in production.
    EMAIL_FROM: z.string().default("Prosisit Table <onboarding@resend.dev>"),
    // Twilio (https://twilio.com) is used to send transactional SMS — currently
    // the reservation confirmation for customers who have no email on file.
    // All three are optional in development: when any is missing, messages are
    // logged to the console instead of sent, matching the mailer's behaviour.
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    // Sending number in E.164 format (e.g. "+15005550006"), or a Messaging
    // Service SID — both are accepted by Twilio's `from` field.
    TWILIO_PHONE_NUMBER: z.string().optional(),
    // Default country calling code (e.g. "+45") used to normalise customer
    // phone numbers that were stored without an international prefix.
    SMS_DEFAULT_COUNTRY_CODE: z.string().optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return

    // Guest-facing links are built from APP_URL, so a localhost value in
    // production means every confirmation email/SMS is dead on arrival.
    // Fail at boot instead of shipping broken links to real customers.
    if (/localhost|127\.0\.0\.1/.test(cfg.APP_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message:
          "APP_URL must be set to the public site URL in production (it currently points at localhost, which would send customers unusable confirmation links).",
      })
    }

    if (/localhost|127\.0\.0\.1/.test(cfg.CORS_ORIGIN)) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGIN"],
        message: "CORS_ORIGIN must be set to the public site origin(s) in production.",
      })
    }
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration")
}

export const env = {
  ...parsed.data,
  // Trailing slashes would produce double-slashed links ("https://site.com//reservation/confirm"),
  // which some hosts and mail clients mangle. Normalise once here.
  APP_URL: parsed.data.APP_URL.replace(/\/+$/, ""),
}
