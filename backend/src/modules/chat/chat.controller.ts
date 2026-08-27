import { Request, Response } from "express"
import { chatService } from "./chat.service"

export class ChatController {
  async handleMessage(req: Request, res: Response) {
    try {
      const { message, context, restaurantId } = req.body
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" })
      }

      const response = await chatService.processMessage({
        message,
        context,
        restaurantId,
      })

      return res.json(response)
    } catch (error) {
      console.error("Chat error:", error)
      return res.status(500).json({ error: "Failed to process chat message" })
    }
  }

  async handleWhatsAppInquiry(req: Request, res: Response) {
    try {
      const { name, phone, message, pageUrl, restaurantId } = req.body
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" })
      }

      const result = await chatService.recordWhatsAppInquiry({
        name,
        phone,
        message,
        pageUrl,
        restaurantId,
      })

      return res.json(result)
    } catch (error) {
      console.error("WhatsApp inquiry error:", error)
      return res.status(500).json({ error: "Failed to record WhatsApp inquiry" })
    }
  }
}

export const chatController = new ChatController()
