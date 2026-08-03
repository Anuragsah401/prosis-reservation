import { z } from "zod"

/**
 * Shared password policy: at least 8 characters, with at least one letter
 * and one number. Keeps signup usable while blocking trivially weak
 * passwords like "12345678" or "password".
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters") // bcrypt truncates beyond 72 bytes
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number")

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  password: passwordSchema,
  // Self-signup (creates a brand-new restaurant + owner role):
  restaurantName: z.string().trim().min(1).max(120).optional(),
  restaurantPhone: z.string().trim().max(32).optional(),
  restaurantTimezone: z.string().trim().max(64).optional(),
  // Staff-invite path (joins an existing restaurant), mutually exclusive
  // with restaurantName in practice:
  restaurantId: z.string().trim().min(1).optional(),
  roleId: z.string().trim().min(1).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
