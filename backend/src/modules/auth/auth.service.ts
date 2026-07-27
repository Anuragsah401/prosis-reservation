import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/db/client"
import { env } from "@/config/env"

const SALT_ROUNDS = 10

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
  async register(data: {
    email: string
    password: string
    name: string
    restaurantId?: string
    roleId?: string
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new Error("Email already in use")
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

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

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user || !user.isActive) {
      throw new Error("Invalid credentials")
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash)
    if (!isValid) {
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
