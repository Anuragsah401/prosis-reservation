import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { prisma } from "@/db/client"
import { env } from "@/config/env"
import { slugify } from "@/utils/slugify"
import { mailer } from "@/utils/mailer"
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from "@/modules/auth/auth.validation"

const SALT_ROUNDS = 12
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export type JwtPayload = {
  sub: string
  email: string
  restaurantId: string | null
  roleId: string | null
}

function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] })
}

function toSafeUser(user: {
  id: string
  email: string
  name: string
  phone: string | null
  isActive: boolean
  restaurantId: string | null
  roleId: string | null
  createdAt: Date
  updatedAt: Date
  passwordHash?: string
}) {
  const { passwordHash: _passwordHash, ...safeUser } = user
  return safeUser
}

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new Error("Email already in use")
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    // Self-signup: create a brand-new restaurant + an "Owner" role with full
    // permissions + the user, all in one transaction so a failed step never
    // leaves an orphaned restaurant or role behind.
    if (data.restaurantName) {
      const user = await prisma.$transaction(async (tx) => {
        const baseSlug = slugify(data.restaurantName!) || "restaurant"
        let slug = baseSlug
        let suffix = 1
        while (await tx.restaurant.findUnique({ where: { slug } })) {
          suffix += 1
          slug = `${baseSlug}-${suffix}`
        }

        const restaurant = await tx.restaurant.create({
          data: {
            name: data.restaurantName!,
            slug,
            phone: data.restaurantPhone,
            logoUrl: data.restaurantLogoUrl || null,
            timezone: data.restaurantTimezone || "UTC",
            email: data.email,
            openingTime: data.restaurantOpeningTime ?? 660, // 11:00 AM default
            closingTime: data.restaurantClosingTime ?? 1380, // 11:00 PM default
          },
        })

        const ownerRole = await tx.role.create({
          data: {
            name: "Owner",
            permissions: ["*"],
            restaurantId: restaurant.id,
          },
        })

        return tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            name: data.name,
            restaurantId: restaurant.id,
            roleId: ownerRole.id,
          },
          include: { restaurant: true },
        })
      })

      const token = signToken({
        sub: user.id,
        email: user.email,
        restaurantId: user.restaurantId,
        roleId: user.roleId,
      })

      // Send welcome email asynchronously without blocking registration response
      mailer
        .sendWelcomeEmail({
          to: user.email,
          name: user.name,
          restaurantName: data.restaurantName,
          restaurantId: user.restaurantId,
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[auth] Failed to send welcome email:", err)
        })

      return { user: toSafeUser(user), token }
    }

    // Staff-invite path: join an existing restaurant/role.
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        restaurantId: data.restaurantId,
        roleId: data.roleId,
      },
      include: { restaurant: true },
    })

    const token = signToken({
      sub: user.id,
      email: user.email,
      restaurantId: user.restaurantId,
      roleId: user.roleId,
    })

    // Send welcome email to staff member
    mailer
      .sendWelcomeEmail({
        to: user.email,
        name: user.name,
        restaurantId: user.restaurantId,
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[auth] Failed to send staff welcome email:", err)
      })

    return { user: toSafeUser(user), token }
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { restaurant: true },
    })
    // Compare against a dummy hash when the user doesn't exist so the
    // response time doesn't leak whether an email is registered.
    const hashToCompare = user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsa"
    const isValid = await bcrypt.compare(data.password, hashToCompare)

    // User must exist, be active, match password, and belong to an existing active restaurant
    if (!user || !user.isActive || !isValid || !user.restaurant || !user.restaurant.isActive) {
      throw new Error("Invalid credentials")
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      restaurantId: user.restaurantId,
      roleId: user.roleId,
    })

    return { user: toSafeUser(user), token }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    })
    if (!user || !user.isActive || !user.restaurant || !user.restaurant.isActive) {
      return null
    }
    return toSafeUser(user)
  },

  /**
   * Issues a password reset token for the given email, if a matching active
   * user exists, and emails the reset link via the configured mail provider
   * (Resend). Always resolves successfully (no error thrown) regardless of
   * whether the email is registered, so the API response never leaks
   * account existence — the caller should show a generic "check your email"
   * message either way.
   */
  async requestPasswordReset(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } })

    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex")
      const tokenHash = hashResetToken(rawToken)
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      })

      const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`
      await mailer.sendPasswordResetEmail(user.email, resetUrl)
    }

    return { message: "If an account exists for that email, a reset link has been sent." }
  },

  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = hashResetToken(data.token)
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new Error("Invalid or expired reset token")
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ])

    return { message: "Password has been reset successfully." }
  },
}
