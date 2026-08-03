import type { Request, Response, NextFunction } from "express"
import type { ZodType } from "zod"

/**
 * Generic request-body validation middleware. Parses `req.body` against the
 * given Zod schema, replacing `req.body` with the parsed (and
 * trimmed/normalized) result on success, or responding 400 with a flattened
 * error map on failure.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }
}
