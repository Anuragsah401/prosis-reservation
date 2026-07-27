import type { Request, Response, NextFunction } from "express"
import { customerService } from "@/modules/customer/customer.service"

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.query.restaurantId)
      const result = await customerService.list(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.getById(String(req.params.id))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.create(req.body)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.update(String(req.params.id), req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.remove(String(req.params.id))
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
