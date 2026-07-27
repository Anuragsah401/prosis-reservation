import { PrismaClient } from "@prisma/client"
import { env } from "@/config/env"

// Prevent multiple PrismaClient instances during dev hot-reload.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma
}
