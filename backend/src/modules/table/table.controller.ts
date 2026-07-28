import type { Request, Response, NextFunction } from "express"
import { tableService } from "@/modules/table/table.service"
import { createTableSchema, updateTableSchema, saveLayoutSchema } from "@/modules/table/table.validation"

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

  async saveLayout(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = saveLayoutSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.saveLayout(parsed.data.restaurantId, parsed.data.tables)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Tables not found")) {
        return res.status(404).json({ error: err.message })
      }
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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTableSchema.safeParse(req.body)
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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateTableSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await tableService.update(String(req.params.id), parsed.data)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Table not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await tableService.remove(String(req.params.id))
      res.status(204).send()
    } catch (err) {
      if (err instanceof Error && err.message === "Table not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },
}
