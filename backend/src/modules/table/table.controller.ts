import type { Request, Response, NextFunction } from "express"
import { prisma } from "@/db/client"
import { tableService } from "@/modules/table/table.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"
import {
  createTableSchema,
  updateTableSchema,
  saveLayoutSchema,
  syncFloorPlanSchema,
} from "@/modules/table/table.validation"

async function resolveRestaurantId(req: AuthenticatedRequest): Promise<string | undefined> {
  let restaurantId: string | undefined = req.user?.restaurantId ?? undefined
  if (!restaurantId && req.user?.sub) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { restaurantId: true },
    })
    restaurantId = user?.restaurantId ?? undefined
  }
  return restaurantId
}

export const tableController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      let restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : ""
      const authUser = (req as AuthenticatedRequest).user
      if ((!restaurantId || restaurantId === "undefined" || restaurantId === "null") && authUser?.sub) {
        const user = await prisma.user.findUnique({
          where: { id: authUser.sub },
          select: { restaurantId: true },
        })
        restaurantId = user?.restaurantId ?? ""
      }
      if (!restaurantId || restaurantId === "undefined" || restaurantId === "null") {
        return res.status(200).json([])
      }
      const date = req.query.date ? String(req.query.date) : undefined
      const reservedFor = req.query.reservedFor ? String(req.query.reservedFor) : undefined
      const result = await tableService.list(restaurantId, { date, reservedFor })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async listFloors(req: Request, res: Response, next: NextFunction) {
    try {
      let restaurantId = req.query.restaurantId ? String(req.query.restaurantId) : ""
      const authUser = (req as AuthenticatedRequest).user
      if ((!restaurantId || restaurantId === "undefined" || restaurantId === "null") && authUser?.sub) {
        const user = await prisma.user.findUnique({
          where: { id: authUser.sub },
          select: { restaurantId: true },
        })
        restaurantId = user?.restaurantId ?? ""
      }
      if (!restaurantId || restaurantId === "undefined" || restaurantId === "null") {
        return res.status(200).json([])
      }
      const result = await tableService.listFloors(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async saveLayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveRestaurantId(req)
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = saveLayoutSchema.safeParse({ ...req.body, restaurantId })
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.saveLayout(restaurantId, parsed.data.tables)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Tables not found")) {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  /** Full floor-plan sync (upsert by name + prune) from the designer. */
  async syncFloorPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveRestaurantId(req)
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = syncFloorPlanSchema.safeParse({ ...req.body, restaurantId })
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.syncFloorPlan(restaurantId, parsed.data.tables)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tableService.getById(String(req.params.id))
      if (!result) {
        return res.status(404).json({ error: "Table not found" })
      }
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveRestaurantId(req)
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = createTableSchema.safeParse({ ...req.body, restaurantId })
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.create(parsed.data)
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Table name already in use for this restaurant") {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveRestaurantId(req)
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = updateTableSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.update(String(req.params.id), restaurantId, parsed.data)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Table not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = await resolveRestaurantId(req)
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      await tableService.remove(String(req.params.id), restaurantId)
      res.status(204).send()
    } catch (err) {
      if (err instanceof Error && err.message === "Table not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },
}
