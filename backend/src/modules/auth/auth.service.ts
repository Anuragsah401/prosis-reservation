import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/db/client"
import { env } from "@/config/env"
import { slugify } from "@/utils/slugify"
import type { RegisterInput, LoginInput } from "@/modules/auth/auth.validation"

const SALT_ROUNDS = 12

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
            timezone: data.restaurantTimezone || "UTC",
            email: data.email,
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
        })
      })

      const token = signToken({
        sub: user.id,
        email: user.email,
        restaurantId: user.restaurantId,
        roleId: user.roleId,
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
    })

    const token = signToken({
      sub: user.id,
      email: user.email,
      restaurantId: user.restaurantId,
      roleId: user.roleId,
    })

    return { user: toSafeUser(user), token }
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    // Compare against a dummy hash when the user doesn't exist so the
    // response time doesn't leak whether an email is registered.
    const hashToCompare = user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsa"
    const isValid = await bcrypt.compare(data.password, hashToCompare)

    if (!user || !user.isActive || !isValid) {
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
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user ? toSafeUser(user) : null
  },
}
