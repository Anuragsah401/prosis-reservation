import { Router } from "express"
import { realtimeController } from "@/modules/realtime/realtime.controller"

export const realtimeRouter = Router()

realtimeRouter.get("/stream", realtimeController.stream)

