import type { Request, Response, NextFunction } from "express"
import { tableService } from "@/modules/table/table.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"
import {
  createTableSchema,
  updateTableSchema,
  saveLayoutSchema,
  syncFloorPlanSchema,
} from "@/modules/table/table.validation"

export const tableController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.query.restaurantId)
      const result = await tableService.list(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async listFloors(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.query.restaurantId)
      const result = await tableService.listFloors(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async saveLayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
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
      const restaurantId = req.user?.restaurantId
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
      const restaurantId = req.user?.restaurantId
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
      const restaurantId = req.user?.restaurantId
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
      const restaurantId = req.user?.restaurantId
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
