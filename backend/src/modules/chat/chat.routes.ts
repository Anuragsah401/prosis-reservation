import { Router } from "express"
import { chatController } from "./chat.controller"

export const chatRouter = Router()

chatRouter.post("/message", (req, res) => chatController.handleMessage(req, res))
chatRouter.post("/whatsapp-inquiry", (req, res) => chatController.handleWhatsAppInquiry(req, res))
