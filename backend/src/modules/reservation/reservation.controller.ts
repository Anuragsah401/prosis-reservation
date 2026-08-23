import type { Request, Response, NextFunction } from "express"
import { reservationService } from "@/modules/reservation/reservation.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"
import {
  createReservationSchema,
  updateReservationSchema,
  updateReservationStatusSchema,
  checkAvailabilitySchema,
  confirmReservationSchema,
  cancelReservationByTokenSchema,
  resendConfirmationEmailSchema,
  publicBookSchema,
} from "@/modules/reservation/reservation.validation"

// Errors from the public confirmation flow that are safe to expose to guests.
const CONFIRMATION_ERRORS = new Set([
  "Invalid confirmation link",
  "This reservation has been cancelled",
  "This reservation is already confirmed",
  "This reservation can no longer be cancelled",
  "Selected table not found",
  "Selected table is too small for your party",
  "Table is not available at the requested time",
])

export const reservationController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await reservationService.list(restaurantId)
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
      const result = await reservationService.getById(String(req.params.id), restaurantId)
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

  async publicBook(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = publicBookSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.publicBook(parsed.data)
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message === "Restaurant not found or not accepting bookings" ||
          err.message === "Selected table is not available" ||
          err.message === "Selected table cannot accommodate this party size" ||
          err.message === "Selected table is not available at the requested time" ||
          err.message === "Table is not available at the requested time"
        ) {
          return res.status(409).json({ error: err.message })
        }
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
      const parsed = createReservationSchema.safeParse({
        ...req.body,
        restaurantId,
        createdById: req.user?.sub,
      })
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

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = updateReservationSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.update(String(req.params.id), restaurantId, parsed.data)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = updateReservationStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.updateStatus(String(req.params.id), restaurantId, parsed.data.status)
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

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const result = await reservationService.cancel(String(req.params.id), restaurantId)
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

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      await reservationService.remove(String(req.params.id), restaurantId)
      res.status(204).send()
    } catch (err) {
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },

  /** Public: fetch confirmation details for a guest-facing confirm page. */
  async getConfirmationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.query.token ?? "")
      if (!token) {
        return res.status(400).json({ error: "token is required" })
      }
      const result = await reservationService.getByConfirmationToken(token)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && CONFIRMATION_ERRORS.has(err.message)) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  /** Public: confirm a reservation (optionally choosing a table). */
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = confirmReservationSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.confirmByToken(parsed.data.token, parsed.data.tableId)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && CONFIRMATION_ERRORS.has(err.message)) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  /** Public: cancel a reservation from the guest's confirmation link. */
  async cancelByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = cancelReservationByTokenSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const result = await reservationService.cancelByToken(parsed.data.token)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && CONFIRMATION_ERRORS.has(err.message)) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  /** Staff: re-send confirmation email to any email address. */
  async resendConfirmationEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.user?.restaurantId
      if (!restaurantId) {
        return res.status(400).json({ error: "No restaurant associated with this account" })
      }
      const parsed = resendConfirmationEmailSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      }
      const reservationId = String(req.params.id)
      const result = await reservationService.resendConfirmationEmail(reservationId, restaurantId, parsed.data.email)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && CONFIRMATION_ERRORS.has(err.message)) {
        return res.status(400).json({ error: err.message })
      }
      if (err instanceof Error && err.message === "Reservation not found") {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  },
}
