export interface ChatQueryInput {
  message: string
  context?: "landing" | "booking" | "dashboard"
  restaurantId?: string
}

export interface ChatMessageResponse {
  reply: string
  actions?: Array<{ label: string; url: string }>
  followUps?: string[]
}

export class ChatService {
  async processMessage(input: ChatQueryInput): Promise<ChatMessageResponse> {
    const query = (input.message || "").toLowerCase().trim()

    // 0. WhatsApp Integration Note
    if (query.includes("whatsapp") || query.includes("wa.me") || query.includes("wa")) {
      return {
        reply:
          "To chat directly with our team or the restaurant owner on WhatsApp, please switch to the **WhatsApp Direct** tab at the top of this chat!",
        actions: [{ label: "Start Free Trial", url: "/signup" }],
        followUps: ["How much does Seat Booking cost?", "How does the 2D floor plan work?"],
      }
    }

    // 1. Pricing & Plans
    if (query.includes("price") || query.includes("cost") || query.includes("plan") || query.includes("subscription")) {
      return {
        reply:
          "Seat Booking offers transparent pricing with zero per-cover fees:\n\n" +
          "• Starter ($0/mo): 1 restaurant, up to 10 tables, public booking page, email support.\n" +
          "• Growth ($49/mo): Unlimited tables & floors, real-time SSE reservations calendar, customer CRM, email/SMS confirmations, and analytics.\n" +
          "• Multi-location (Custom): Multi-venue management, role-based access, dedicated onboarding.\n\n" +
          "Includes a 14-day free trial with no credit card required.",
        actions: [
          { label: "Compare Plans", url: "/#pricing" },
          { label: "Start Free Trial", url: "/signup" },
        ],
        followUps: ["Is there a credit card required?", "Can I cancel anytime?"],
      }
    }

    // 2. Floor Plan Builder
    if (query.includes("floor") || query.includes("canvas") || query.includes("layout") || query.includes("table builder")) {
      return {
        reply:
          "Our 2D Floor Plan Designer lets you visually map your dining room:\n\n" +
          "• Drag-and-drop rectangular, square, circle, and booth tables.\n" +
          "• Multi-floor tabs (Main Dining Room, Rooftop Terrace, Bar, Patio).\n" +
          "• Add architectural landmarks (Bars, Restrooms, Entrances, Kitchen Pass).\n" +
          "• Real-time color-coded table statuses (Available, Reserved, Seated, Maintenance).",
        actions: [
          { label: "Floor Plan Designer", url: "/floor-plan" },
          { label: "Interactive Demo", url: "/#demo" },
        ],
        followUps: ["How do conflict checks work?", "Can I add multiple floors?"],
      }
    }

    // 3. Reservations & Conflict Checks
    if (query.includes("reserve") || query.includes("booking") || query.includes("timeline") || query.includes("conflict")) {
      return {
        reply:
          "Seat Booking provides a real-time reservation timeline with conflict prevention:\n\n" +
          "• Automatic collision detection ensures no table is double-booked.\n" +
          "• Switch between Timeline, Calendar, and List views.\n" +
          "• 1-Click Walk-In seating marks tables as SEATED instantly.\n" +
          "• Supports celebration tags (Birthday, Anniversary) and dietary requirements (Gluten-Free, Allergies).",
        actions: [{ label: "View Timeline", url: "/reservations" }],
        followUps: ["How do I seat walk-ins?", "How do email confirmations work?"],
      }
    }

    // 4. Public Online Booking & Confirmation
    if (query.includes("online booking") || query.includes("public link") || query.includes("confirm") || query.includes("cancel")) {
      return {
        reply:
          "Every restaurant gets a 24/7 public booking link (/restaurant/:id/book):\n\n" +
          "• Diners select date, time, and party size in real-time.\n" +
          "• Guests can pick specific tables from your interactive 2D floor plan or choose auto-assignment.\n" +
          "• Automated confirmation emails contain a 1-click self-service link to confirm or cancel their booking.",
        actions: [{ label: "Open Settings", url: "/settings?section=profile" }],
        followUps: ["How does SMS reminders work?", "Can I turn off online booking?"],
      }
    }

    // 5. Customer CRM
    if (query.includes("customer") || query.includes("crm") || query.includes("guest") || query.includes("vip")) {
      return {
        reply:
          "The Customer CRM (/customers) automatically tracks every guest's visit history, total covers, no-show record, custom tags (VIP, Regular, Wine Lover), and persistent dietary notes.",
        actions: [{ label: "Open Customer CRM", url: "/customers" }],
        followUps: ["Can I manually add a customer?", "How do I search guests?"],
      }
    }

    // 6. Analytics & ROI
    if (query.includes("analytics") || query.includes("report") || query.includes("roi") || query.includes("peak hours")) {
      return {
        reply:
          "The Analytics Dashboard (/analytics) gives real numbers on your service: 7/14/30-day covers trends, peak hours heatmaps, table utilization percentages, and average turn times in minutes.",
        actions: [
          { label: "View Analytics", url: "/analytics" },
          { label: "ROI Calculator", url: "/#calculator" },
        ],
        followUps: ["How much revenue can I save?", "What is table utilization?"],
      }
    }

    // Default
    return {
      reply:
        "I'm here to assist with everything in **Seat Booking**! You can ask about our 2D floor plan designer, real-time booking timeline, pricing plans, guest CRM, or setup guides.",
      actions: [
        { label: "Start Free Trial", url: "/signup" },
        { label: "Interactive Demo", url: "/#demo" },
        { label: "View Pricing", url: "/#pricing" },
      ],
      followUps: [
        "How does the 2D floor plan work?",
        "What are your pricing plans?",
        "How fast is setup?",
      ],
    }
  }

  async recordWhatsAppInquiry(input: {
    name?: string
    phone?: string
    message: string
    pageUrl?: string
    restaurantId?: string
  }): Promise<{ success: boolean; whatsappUrl: string }> {
    const targetPhone = process.env.WHATSAPP_NUMBER || "15557328266"
    const formattedText =
      `👋 *New Inquiry from Website*\n` +
      `👤 *Name:* ${input.name || "Guest"}\n` +
      `📱 *Contact:* ${input.phone || "Not provided"}\n` +
      `📍 *Page:* ${input.pageUrl || "Website"}\n\n` +
      `💬 *Message:*\n${input.message}`

    const whatsappUrl = `https://wa.me/${targetPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(formattedText)}`

    console.log(`[WhatsApp Inquiry] From: ${input.name || "Guest"} (${input.phone || "N/A"}): ${input.message}`)

    return {
      success: true,
      whatsappUrl,
    }
  }
}

export const chatService = new ChatService()
