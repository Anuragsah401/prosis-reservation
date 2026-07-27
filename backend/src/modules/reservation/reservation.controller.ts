import type { Request, Response, NextFunction } from "express"
import { reservationService } from "@/modules/reservation/reservation.service"
import {
  createReservationSchema,
  updateReservationSchema,
  updateReservationStatusSchema,
  checkAvailabilitySchema,
} from "@/modules/reservation/reservation.validation"

export const reservationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = String(req.query.restaurantId)
      const result = await reservationService.list(restaurantId)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.getById(String(req.params.id))
      if (!result) {
        return res.status(404).json({ error: "Reservation not found" })
      }
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = checkAvailabilitySchema.safeParse(req.query)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.checkAvailability(parsed.data)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createReservationSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.create(parsed.data)
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Table is not available at the requested time") {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateReservationSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.update(String(req.params.id), parsed.data)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateReservationStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.updateStatus(String(req.params.id), parsed.data.status)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      if (err instanceof Error && err.message.startsWith("Cannot transition")) {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.cancel(String(req.params.id))
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      if (err instanceof Error && err.message.startsWith("Cannot transition")) {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await reservationService.remove(String(req.params.id))
      res.status(204).send()
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },
}
