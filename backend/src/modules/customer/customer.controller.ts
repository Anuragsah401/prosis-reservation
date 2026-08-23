import type { Response, NextFunction } from "express"
import { customerService } from "@/modules/customer/customer.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"

export const customerController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await customerService.list(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await customerService.getById(String(req.params.id), restaurantId)
      if (!result) {
        return res.status(404).json({ error: "Customer not found" })
      }
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getReservations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await customerService.getReservations(String(req.params.id), restaurantId)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Customer not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await customerService.create({
        ...req.body,
        restaurantId,
      })
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await customerService.update(String(req.params.id), restaurantId, req.body)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Customer not found") {
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
      await customerService.remove(String(req.params.id), restaurantId)
      res.status(204).send()
    } catch (err) {
      if (err instanceof Error && err.message === "Customer not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },
}
