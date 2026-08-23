import type { Request, Response, NextFunction } from "express"
import { restaurantService } from "@/modules/restaurant/restaurant.service"
import { createRestaurantSchema, updateRestaurantSchema } from "@/modules/restaurant/restaurant.validation"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"

export const restaurantController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await restaurantService.list()
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await restaurantService.getById(String(req.params.id))
      if (!result) {
        return res.status(404).json({ error: "Restaurant not found" })
      }
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(404).json({ error: "No restaurant associated with this account" })
      }
      const result = await restaurantService.getProfile(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Restaurant not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createRestaurantSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await restaurantService.create(parsed.data)
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Slug already in use") {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId || restaurantId !== req.params.id) {
        return res.status(403).json({ error: "You are not authorized to update this restaurant" })
      }
      const parsed = updateRestaurantSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await restaurantService.update(String(req.params.id), parsed.data)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Restaurant not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId || restaurantId !== req.params.id) {
        return res.status(403).json({ error: "You are not authorized to delete this restaurant" })
      }
      await restaurantService.remove(String(req.params.id))
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
