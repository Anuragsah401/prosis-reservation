export interface ChatAction {
  label: string
  url?: string
  actionKey?: string
}

export interface ChatResponse {
  message: string
  actions?: ChatAction[]
  followUps?: string[]
}

export interface KnowledgeItem {
  id: string
  category: string
  keywords: string[]
  response: ChatResponse
}

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // -------------------------------------------------------------
  // 1. GETTING STARTED & SIGNUP
  // -------------------------------------------------------------
  {
    id: "getting-started",
    category: "Onboarding",
    keywords: [
      "get started", "sign up", "signup", "register", "create account",
      "onboarding", "how to start", "new restaurant", "setup", "quick start"
    ],
    response: {
      message:
        "Getting started with **Seat Booking** takes less than **5 minutes** in 3 simple steps:\n\n" +
        "1. **Create Your Account**: Enter your name, email, and password.\n" +
        "2. **Restaurant Details**: Provide your restaurant name, cuisine type (Italian, American, Indian, Japanese, Mexican, etc.), and phone number.\n" +
        "3. **Tables & Service Hours**: Specify your table count range and operating hours (opening & closing times).\n\n" +
        "🎉 You get an instant **14-day free trial** with full access to the 2D floor plan builder, reservations calendar, and public booking link!",
      actions: [
        { label: "🚀 Start Free Trial", url: "/signup" },
        { label: "🎥 Watch Interactive Demo", url: "/#demo" },
      ],
      followUps: [
        "Is a credit card required for the trial?",
        "How do I set up my 2D floor plan?",
        "What pricing plans are available?",
      ],
    },
  },
  {
    id: "trial-and-card",
    category: "Onboarding",
    keywords: [
      "free trial", "credit card", "14 day", "trial period", "card required",
      "payment method", "risk free", "guarantee", "trial details"
    ],
    response: {
      message:
        "**No credit card is required** to sign up for the 14-day free trial.\n\n" +
        "• Enjoy full access to all features (floor plan builder, reservations timeline, guest CRM, notifications).\n" +
        "• No automatic charges when the trial ends.\n" +
        "• Upgrade to **Growth ($49/mo)** or choose our free tier whenever you're ready.",
      actions: [{ label: "Start 14-Day Free Trial", url: "/signup" }],
      followUps: ["What happens after the trial ends?", "How much does Growth cost?"],
    },
  },
  {
    id: "password-rules",
    category: "Security",
    keywords: [
      "password", "password rules", "forgot password", "reset password",
      "login problem", "security", "change password"
    ],
    response: {
      message:
        "**Password & Security Guidelines**:\n\n" +
        "• Passwords must be at least **8 characters long** and contain at least **one letter and one number**.\n" +
        "• If you forget your password, click **\"Forgot Password?\"** on the sign-in page to receive a secure 1-hour reset token via email.\n" +
        "• You can change your password anytime in **Settings → Security**.",
      actions: [
        { label: "Reset Password", url: "/forgot-password" },
        { label: "Sign In", url: "/login" },
      ],
      followUps: ["How do I invite staff to my restaurant?", "How secure is my data?"],
    },
  },

  // -------------------------------------------------------------
  // 2. PRICING & SUBSCRIPTIONS
  // -------------------------------------------------------------
  {
    id: "pricing-overview",
    category: "Pricing",
    keywords: [
      "price", "pricing", "cost", "plan", "subscription", "how much",
      "starter", "growth", "enterprise", "multi-location", "billing"
    ],
    response: {
      message:
        "Seat Booking offers simple, transparent pricing for restaurants of every size:\n\n" +
        "• **Starter ($0 / mo)**: 1 restaurant, up to 10 tables, public booking link, email support.\n" +
        "• **Growth ($49 / mo)**: Unlimited tables & floors, real-time SSE reservations calendar, customer CRM with guest tags, automated email & SMS alerts, and priority support.\n" +
        "• **Multi-location (Custom)**: Multiple venue management, centralized reporting, role-based access control, and dedicated onboarding.",
      actions: [
        { label: "Compare Plans", url: "/#pricing" },
        { label: "Start Free Trial", url: "/signup" },
      ],
      followUps: [
        "Can I cancel anytime?",
        "Are there any per-cover booking fees?",
        "What is the ROI calculator?",
      ],
    },
  },
  {
    id: "no-cover-fees",
    category: "Pricing",
    keywords: [
      "cover fee", "per cover", "booking fee", "commission", "hidden fees",
      "transaction fee", "contract", "cancel anytime"
    ],
    response: {
      message:
        "**Zero Per-Cover Fees & Zero Hidden Charges!**\n\n" +
        "Unlike other platforms that charge $1.00 to $2.50 for every guest booked, Seat Booking has **$0 cover fees**. All direct bookings through your website and social links are 100% free.\n\n" +
        "• No contracts — cancel or change your plan at any time.\n" +
        "• Keep 100% of your customer relationships and revenue.",
      actions: [{ label: "Calculate Your Savings", url: "/#calculator" }],
      followUps: ["How does the public booking link work?", "What features are in Growth?"],
    },
  },

  // -------------------------------------------------------------
  // 3. 2D FLOOR PLAN DESIGNER
  // -------------------------------------------------------------
  {
    id: "floor-plan-builder",
    category: "Floor Plan",
    keywords: [
      "floor plan", "2d", "canvas", "floor plan designer", "drag and drop",
      "draw floor", "table layout", "create tables", "editor"
    ],
    response: {
      message:
        "The **2D Floor Plan Designer** (`/floor-plan`) lets you replicate your restaurant dining room with pixel precision:\n\n" +
        "• **Drag & Drop**: Place tables anywhere on the grid canvas.\n" +
        "• **Shapes & Sizes**: Choose from **Rectangle**, **Square**, **Circle**, or custom booth seating.\n" +
        "• **Capacities**: Assign seat counts (e.g. 2-top, 4-top, 6-top, 10-top banquet).\n" +
        "• **Rotation & Scaling**: Rotate tables and adjust dimensions freely.\n" +
        "• **Live Status Sync**: Tables visually reflect real-time statuses (Available 🟢, Reserved 🔵, Seated 🟣, Maintenance 🔴).\n" +
        "• **Auto-Save**: Changes save to local storage and sync directly to the database.",
      actions: [
        { label: "Open Floor Plan Designer", url: "/floor-plan" },
        { label: "Try Interactive Demo", url: "/#demo" },
      ],
      followUps: [
        "Can I add multiple floors or outdoor patios?",
        "How do I add bars and restrooms?",
        "How do table conflict checks work?",
      ],
    },
  },
  {
    id: "multi-floor-management",
    category: "Floor Plan",
    keywords: [
      "multiple floors", "multi floor", "patio", "terrace", "rooftop",
      "bar area", "sections", "add floor", "delete floor"
    ],
    response: {
      message:
        "**Multi-Floor & Dining Zone Support**:\n\n" +
        "You can create distinct floor tabs in your Floor Plan Designer:\n" +
        "• **Main Dining Room** (Ground Floor)\n" +
        "• **Rooftop Terrace / Patio**\n" +
        "• **Private Dining Room (PDR) & VIP Mezzanine**\n" +
        "• **Bar & Lounge Area**\n\n" +
        "Switch between floors in 1 click to manage table seatings independently.",
      actions: [{ label: "Design Floor Plan", url: "/floor-plan" }],
      followUps: ["How do I add facility landmarks?", "How do walk-ins work?"],
    },
  },
  {
    id: "facilities-and-landmarks",
    category: "Floor Plan",
    keywords: [
      "facility", "landmark", "restroom", "wc", "bar", "kitchen pass",
      "host stand", "entrance", "exit", "pillar", "architectural"
    ],
    response: {
      message:
        "You can add architectural landmarks via **\"Add Facility / Area\"** on the floor plan canvas:\n\n" +
        "• **Main Bar & Countertops**\n" +
        "• **Restrooms / Guest WC**\n" +
        "• **Main Entrance & Emergency Exits**\n" +
        "• **Kitchen Pass / Service Stations**\n" +
        "• **Host Stand**\n\n" +
        "This helps new host staff and servers navigate the floor effortlessly.",
      actions: [{ label: "Open Floor Plan", url: "/floor-plan" }],
      followUps: ["Can guests see the floor plan when booking?", "How do I assign tables?"],
    },
  },

  // -------------------------------------------------------------
  // 4. RESERVATIONS & CALENDAR ENGINE
  // -------------------------------------------------------------
  {
    id: "reservations-timeline",
    category: "Reservations",
    keywords: [
      "reservation", "booking", "timeline", "calendar", "view bookings",
      "reservations page", "host stand", "service management"
    ],
    response: {
      message:
        "The **Reservations Hub** (`/reservations`) provides comprehensive tools for daily service:\n\n" +
        "• **Multiple Views**: Switch between **Timeline Grid** (hourly slot columns), **Calendar View** (Day/Week), and **List Table View**.\n" +
        "• **Booking Details**: Guest name, phone, email, party size, table number, event type, food category, and special requests.\n" +
        "• **Quick Search**: Instantly find any guest by name or phone number.\n" +
        "• **Filter by Date**: Jump to any past or upcoming service date.",
      actions: [
        { label: "View Reservations", url: "/reservations" },
        { label: "Open Dashboard", url: "/dashboard" },
      ],
      followUps: [
        "What reservation statuses are available?",
        "How do I seat walk-in customers?",
        "How do conflict checks work?",
      ],
    },
  },
  {
    id: "reservation-statuses",
    category: "Reservations",
    keywords: [
      "status", "reservation status", "pending", "confirmed", "seated",
      "completed", "cancelled", "no show", "lifecycle"
    ],
    response: {
      message:
        "**Reservation Lifecycle & Statuses**:\n\n" +
        "• 🟡 **PENDING**: Online booking submitted, awaiting staff review (or auto-confirmed if enabled).\n" +
        "• 🔵 **CONFIRMED**: Table and time slot locked in; reminder emails sent.\n" +
        "• 🟣 **SEATED**: Guests have arrived and are currently seated at the table.\n" +
        "• 🟢 **COMPLETED**: Service finished, bill paid, table ready for cleaning.\n" +
        "• ⚪ **CANCELLED**: Cancelled by guest via 1-click email link or by staff.\n" +
        "• 🔴 **NO_SHOW**: Guest failed to arrive within the 15-minute grace period.",
      actions: [{ label: "Manage Reservations", url: "/reservations" }],
      followUps: ["How do I change a reservation status?", "How do email confirmations work?"],
    },
  },
  {
    id: "walk-in-seating",
    category: "Reservations",
    keywords: [
      "walk in", "walk-in", "walkin", "seat walk in", "walk in guest",
      "immediate seating", "no booking", "host desk"
    ],
    response: {
      message:
        "**Seating Walk-In Guests Instantly**:\n\n" +
        "1. Click the **\"Walk In\"** button in the header or reservations timeline.\n" +
        "2. Enter the guest's name and party size (phone number is optional).\n" +
        "3. Choose an available table from your floor plan.\n" +
        "4. Click **\"Seat Walk-In\"** — the table status immediately updates to **SEATED** across all host devices.",
      actions: [{ label: "Go to Reservations", url: "/reservations" }],
      followUps: ["How do conflict checks prevent double bookings?", "How do I add a phone reservation?"],
    },
  },
  {
    id: "conflict-checks",
    category: "Reservations",
    keywords: [
      "conflict", "conflict check", "double booking", "overlap", "overbooking",
      "prevent double book", "capacity check", "buffer"
    ],
    response: {
      message:
        "**Intelligent Double-Booking Prevention**:\n\n" +
        "Seat Booking runs real-time algorithmic checks on every booking:\n" +
        "1. **Time Window Overlap**: Checks if a table has an active reservation during `reservedFor ± duration` (default 90 mins) plus your configured cleaning buffer.\n" +
        "2. **Capacity Validation**: Ensures party size does not exceed the table's maximum seat capacity.\n" +
        "3. **Table Status**: Warns staff if a table is marked as Maintenance or Blocked.",
      followUps: ["Can I customize reservation durations?", "How do buffer times work?"],
    },
  },
  {
    id: "special-requests-events",
    category: "Reservations",
    keywords: [
      "special request", "event type", "birthday", "anniversary", "celebration",
      "dietary", "allergy", "gluten free", "vegetarian", "high chair", "window seat"
    ],
    response: {
      message:
        "**Event Types & Dietary Notes Support**:\n\n" +
        "• **Celebration Types**: Birthday 🎂, Anniversary 🥂, Business Meeting 💼, Romantic Date, Chef Tasting 🍷, or Custom Event.\n" +
        "• **Food Categories**: Breakfast, Brunch, Lunch, Dinner, Vegetarian, Vegan, Gluten-Free, Halal, Kosher, Dessert.\n" +
        "• **Special Requests**: Notes for high chairs, wheelchair access, window seats, or severe allergies (nuts, shellfish, dairy) are prominently displayed on the host stand.",
      actions: [{ label: "View Booking Timeline", url: "/reservations" }],
      followUps: ["How do diners add notes?", "How does Customer CRM remember allergies?"],
    },
  },

  // -------------------------------------------------------------
  // 5. PUBLIC ONLINE BOOKING & GUEST EXPERIENCE
  // -------------------------------------------------------------
  {
    id: "public-booking-flow",
    category: "Guest Experience",
    keywords: [
      "public booking", "guest booking", "online booking link", "book a table",
      "website link", "diner flow", "how guests book", "qr code link"
    ],
    response: {
      message:
        "**24/7 Guest Online Booking Experience** (`/restaurant/:id/book`):\n\n" +
        "1. **Step 1 (Date, Party & Time)**: Guests select date, party size (1-20+ guests), and view real-time open slots within your service hours.\n" +
        "2. **Step 2 (Table Choice)**: Guests can choose **\"Restaurant's Choice\"** (auto-assigned) or pick their favorite available table directly from your **Interactive 2D Floor Plan**.\n" +
        "3. **Step 3 (Guest Info)**: Guests enter their name, email, phone number, and dietary/celebration notes.\n" +
        "4. **Step 4 (Instant Confirmation)**: Immediate confirmation screen and responsive HTML email/SMS dispatched.",
      actions: [{ label: "View Profile & Booking Link", url: "/settings?section=profile" }],
      followUps: [
        "How do guests confirm or cancel their booking?",
        "Can I turn off online bookings during holidays?",
      ],
    },
  },
  {
    id: "reservation-confirmation-page",
    category: "Guest Experience",
    keywords: [
      "confirmation link", "confirm reservation", "cancel reservation", "guest token",
      "reservation confirm page", "1 click confirm", "guest self service"
    ],
    response: {
      message:
        "**Guest Self-Service Confirmation Portal** (`/reservation/confirm?token=...`):\n\n" +
        "Every confirmation email includes a secure, 1-click token link where guests can:\n" +
        "• Verify their reservation time, date, and party size.\n" +
        "• View the venue address and map directions.\n" +
        "• Pick or change their preferred table from the floor plan (if enabled).\n" +
        "• **1-Click Cancel**: If their plans change, guests can cancel directly, freeing up the table immediately for other diners.",
      followUps: ["How does Seat Booking reduce no-shows?", "What emails are sent?"],
    },
  },

  // -------------------------------------------------------------
  // 6. AUTOMATED EMAILS & SMS NOTIFICATIONS
  // -------------------------------------------------------------
  {
    id: "email-and-sms-system",
    category: "Notifications",
    keywords: [
      "email", "sms", "text message", "mailer", "resend", "twilio",
      "notifications page", "welcome mail", "confirmation mail"
    ],
    response: {
      message:
        "**Automated Multi-Channel Communications**:\n\n" +
        "• **Welcome Email**: Welcomes new restaurant managers with onboarding checklists and public booking links.\n" +
        "• **Reservation Confirmation Email**: Styled responsive HTML template with friendly emojis (📅 Date, 👥 Party Size, 🪑 Table, 📍 Venue), custom notes, and Confirm CTA.\n" +
        "• **SMS Alerts (Twilio)**: Sends automated text message reminders.\n" +
        "• **In-App Notifications (`/notifications`)**: Alerts host staff when new online bookings, modifications, or cancellations occur.",
      actions: [
        { label: "Notification Settings", url: "/settings?section=notifications" },
        { label: "View Notifications", url: "/notifications" },
      ],
      followUps: ["How do I set reminder lead times?", "How do I configure SMS?"],
    },
  },

  // -------------------------------------------------------------
  // 7. CUSTOMER CRM & GUEST PROFILES
  // -------------------------------------------------------------
  {
    id: "customer-crm",
    category: "CRM",
    keywords: [
      "customer", "crm", "guest database", "guest profile", "vip",
      "tags", "guest history", "repeat diner", "customer notes"
    ],
    response: {
      message:
        "The **Customer CRM Hub** (`/customers`) builds loyal diner relationships:\n\n" +
        "• **Automatic Guest Creation**: Every new booking creates or links to the customer's permanent profile.\n" +
        "• **Visit & History Tracking**: View lifetime visits, past bookings, and no-show history.\n" +
        "• **Custom Tags**: Label guests with tags like `VIP`, `Regular`, `Wine Lover`, `Chef Friend`, `Quiet Table`.\n" +
        "• **Persistent Notes**: Dietary restrictions, favorite tables, and seating preferences automatically attach to all future reservations.",
      actions: [{ label: "Open Customer CRM", url: "/customers" }],
      followUps: ["Can I manually add a customer?", "How do I search customers?"],
    },
  },

  // -------------------------------------------------------------
  // 8. ANALYTICS, REPORTS & ROI
  // -------------------------------------------------------------
  {
    id: "analytics-and-reports",
    category: "Analytics",
    keywords: [
      "analytics", "reports", "statistics", "peak hours", "turnover",
      "occupancy", "covers", "utilization", "no-show rate", "trends"
    ],
    response: {
      message:
        "The **Analytics Dashboard** (`/analytics`) delivers actionable operational intelligence:\n\n" +
        "• **Reservations & Covers Trend**: 7-day, 14-day, and 30-day traffic comparisons.\n" +
        "• **Peak Hours Heatmap**: Pinpoint your busiest seating times to optimize kitchen and server scheduling.\n" +
        "• **Status Breakdown**: Visual breakdown of Confirmed vs Seated vs Completed vs Cancelled vs No-Show rates.\n" +
        "• **Table Utilization**: Measure what percentage of service hours each table is actively occupied.\n" +
        "• **Average Turn Time**: Track average table turnover duration in minutes.",
      actions: [
        { label: "View Analytics", url: "/analytics" },
        { label: "ROI Calculator", url: "/#calculator" },
      ],
      followUps: ["How does Seat Booking boost revenue?", "What is table turn rate?"],
    },
  },
  {
    id: "roi-calculator",
    category: "Analytics",
    keywords: [
      "roi", "roi calculator", "revenue boost", "extra covers", "hours saved",
      "bottom line", "worth it"
    ],
    response: {
      message:
        "**The Seat Booking ROI Advantage**:\n\n" +
        "• **+18% Extra Covers**: Tightened table turn gaps and automated reminders fill empty seats.\n" +
        "• **~12 Hours Saved Weekly**: Eliminate manual phone tag and spreadsheet juggling.\n" +
        "• **50% Lower No-Shows**: Automated 1-click confirmation emails keep reservations reliable.\n" +
        "• **Average Gross Revenue Boost**: Over **+$14,000 / month** for a 24-table restaurant.",
      actions: [{ label: "Try the ROI Calculator", url: "/#calculator" }],
      followUps: ["How fast can I set up?", "What are the pricing plans?"],
    },
  },

  // -------------------------------------------------------------
  // 9. SETTINGS & RESTAURANT CONFIGURATION
  // -------------------------------------------------------------
  {
    id: "restaurant-settings",
    category: "Settings",
    keywords: [
      "settings", "configure", "service hours", "opening time", "closing time",
      "timezone", "restaurant profile", "slug", "booking rules"
    ],
    response: {
      message:
        "The **Settings Hub** (`/settings`) allows full operational customization:\n\n" +
        "• **Restaurant Profile**: Update restaurant name, slug, phone, address, cuisine, and timezone.\n" +
        "• **Service Hours**: Set opening and closing times (e.g. 11:00 to 23:00).\n" +
        "• **Reservation Rules**: Configure default durations (e.g. 90 min), buffer times (e.g. 15 min), max party sizes (e.g. 12 guests), and advance notice requirements.\n" +
        "• **Auto-Confirm**: Toggle automatic confirmation vs manual host review.\n" +
        "• **Booking Policy**: Define policies shown to guests (e.g. 15-min table hold policy).\n" +
        "• **Language & Theme**: Switch between multiple languages and Dark/Light mode.",
      actions: [
        { label: "Open Settings", url: "/settings" },
        { label: "Edit Service Hours", url: "/settings?section=profile" },
      ],
      followUps: [
        "How do I set booking buffer times?",
        "Can I change the app language?",
      ],
    },
  },
  {
    id: "language-and-themes",
    category: "Settings",
    keywords: [
      "language", "i18n", "spanish", "french", "german", "italian",
      "dark mode", "light mode", "theme", "translations"
    ],
    response: {
      message:
        "**Internationalization & Theme Customization**:\n\n" +
        "• **Language Switcher**: Located in the top header and settings — supports English, Spanish, French, German, Italian, and more.\n" +
        "• **Theme Toggle**: Switch between **Dark Mode** and **Light Mode** anytime with smooth CSS transitions.\n" +
        "• All dates, times, and currencies format automatically to your restaurant's selected timezone.",
      actions: [{ label: "Open Settings", url: "/settings" }],
      followUps: ["How do I change my restaurant profile?", "How do notifications work?"],
    },
  },

  // -------------------------------------------------------------
  // 10. REAL-TIME ENGINE & MULTI-DEVICE SYNC
  // -------------------------------------------------------------
  {
    id: "realtime-sse",
    category: "Technology",
    keywords: [
      "realtime", "real-time", "sse", "server-sent events", "live sync",
      "multiple devices", "ipad", "tablet", "host stand sync"
    ],
    response: {
      message:
        "**Real-Time Multi-Device Synchronization (SSE)**:\n\n" +
        "• Uses high-performance **Server-Sent Events (SSE)** (`/api/realtime/stream`).\n" +
        "• Whenever a diner books online, or a host seats Table 4 on an iPad, all connected devices (phones, host stand iPads, kitchen displays) update **instantly with zero lag**.\n" +
        "• Includes automatic reconnection with exponential backoff if WiFi fluctuates.",
      followUps: ["Does it work on iPads and tablets?", "How secure is the realtime stream?"],
    },
  },

  // -------------------------------------------------------------
  // 11. SECURITY, AUTH & MULTI-TENANCY
  // -------------------------------------------------------------
  {
    id: "security-and-isolation",
    category: "Security",
    keywords: [
      "security", "privacy", "multi-tenant", "isolation", "gdpr",
      "data protection", "jwt", "bcrypt", "audit"
    ],
    response: {
      message:
        "**Enterprise Security & Multi-Tenant Data Isolation**:\n\n" +
        "• **Tenant Scoping**: All database queries, floor plans, customers, and bookings are strictly scoped to your `restaurantId`.\n" +
        "• **BOLA / IDOR Protection**: Real-time SSE streams and API endpoints enforce strict token authorization.\n" +
        "• **Encryption**: Passwords hashed with bcrypt; JWT session tokens with automatic expiry.\n" +
        "• **Cascade Cleanup**: Deleting a venue completely purges all associated records with zero orphaned data.",
      followUps: ["How do I reset my password?", "How do I manage team roles?"],
    },
  },

  // -------------------------------------------------------------
  // 12. GREETINGS & CASUAL CONVERSATION
  // -------------------------------------------------------------
  {
    id: "greetings",
    category: "General",
    keywords: [
      "hello", "hi", "hey", "good morning", "good evening", "good afternoon",
      "how are you", "who are you", "what can you do", "bot", "assistant"
    ],
    response: {
      message:
        "Hello! 👋 I'm **Seat Booking Concierge**, your 24/7 AI assistant for everything related to restaurant reservations, 2D floor plans, and dining room management.\n\n" +
        "Here are a few things you can ask me:\n" +
        "• *\"How does the 2D floor plan designer work?\"*\n" +
        "• *\"What pricing plans and free trials are available?\"*\n" +
        "• *\"How do conflict checks stop double bookings?\"*\n" +
        "• *\"How do guests book online and receive confirmations?\"*\n" +
        "• *\"How do I seat walk-in customers?\"*",
      actions: [
        { label: "🚀 Start Free Trial", url: "/signup" },
        { label: "🎥 Interactive Tour", url: "/#demo" },
        { label: "💳 View Pricing", url: "/#pricing" },
      ],
      followUps: [
        "How do I create a floor plan?",
        "What are your pricing plans?",
        "How fast is setup?",
      ],
    },
  },
  {
    id: "human-support",
    category: "Support",
    keywords: [
      "support", "contact", "human", "help", "email support", "phone number",
      "talk to person", "customer service", "agent"
    ],
    response: {
      message:
        "Our customer support team is always ready to assist:\n\n" +
        "• **Email**: `support@seatbooking.com` (Replies within 1-2 hours)\n" +
        "• **In-App Chat**: Available 24/7 for all Growth and Enterprise accounts\n" +
        "• **Documentation & Guides**: Available directly inside your dashboard settings\n" +
        "• **Dedicated Onboarding**: Available with Multi-location plans.",
      actions: [{ label: "Start Free Trial", url: "/signup" }],
      followUps: ["How do I get started?", "What is included in the 14-day trial?"],
    },
  },
]

// ---------------------------------------------------------------------------
// ADVANCED NATURAL LANGUAGE & SEMANTIC SEARCH ENGINE
// ---------------------------------------------------------------------------

/**
 * Matches a query against the knowledge base using weighted token scoring,
 * keyword matching, and context weighting.
 */
export function matchChatQuery(
  rawQuery: string,
  context?: "landing" | "booking" | "dashboard"
): ChatResponse {
  const query = rawQuery.toLowerCase().trim()
  if (!query) {
    return KNOWLEDGE_BASE.find((k) => k.id === "greetings")!.response
  }

  // Tokenize the input words
  const tokens = query
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)

  let bestMatch: KnowledgeItem | null = null
  let highestScore = 0

  for (const item of KNOWLEDGE_BASE) {
    let score = 0

    // Exact query matching in keywords
    for (const kw of item.keywords) {
      const kwLower = kw.toLowerCase()

      // Full phrase match
      if (query.includes(kwLower)) {
        score += 12 + kwLower.length
      }

      // Token overlap
      for (const token of tokens) {
        if (kwLower === token) {
          score += 6
        } else if (kwLower.includes(token) && token.length > 3) {
          score += 3
        }
      }
    }

    // Contextual weighting boost
    if (context === "booking" && item.category === "Guest Experience") {
      score += 4
    }
    if (context === "dashboard" && (item.category === "Reservations" || item.category === "Floor Plan")) {
      score += 4
    }
    if (context === "landing" && (item.category === "Pricing" || item.category === "Onboarding")) {
      score += 4
    }

    if (score > highestScore) {
      highestScore = score
      bestMatch = item
    }
  }

  // If score is high enough, return matched answer
  if (bestMatch && highestScore >= 6) {
    return bestMatch.response
  }

  // Fallback responses tailored by context
  if (context === "booking") {
    return {
      message:
        "I'm here to help with your reservation! You can select a date, time slot, and party size above to see live table availability. For dietary requirements or high chairs, add a note during checkout!",
      actions: [{ label: "Reserve Table", url: "#" }],
      followUps: [
        "Do you accept walk-ins?",
        "What is the cancellation policy?",
        "Can I choose a patio or window table?",
      ],
    }
  }

  if (context === "dashboard") {
    return {
      message:
        "I'm your **Seat Booking Host Assistant**. I can help you manage floor layouts, track tonight's seating timeline, seat walk-in guests, or review customer CRM notes.",
      actions: [
        { label: "Floor Plan Designer", url: "/floor-plan" },
        { label: "Reservations Timeline", url: "/reservations" },
        { label: "Customer CRM", url: "/customers" },
      ],
      followUps: [
        "How do I seat a walk-in guest?",
        "How do double booking checks work?",
        "How do I add a new dining floor?",
      ],
    }
  }

  return {
    message:
      "I'm here to answer any question about **Seat Booking**! You can ask about our 2D floor plan designer, real-time booking timeline, pricing tiers, guest CRM, or automated email confirmations.",
    actions: [
      { label: "🚀 Start Free Trial", url: "/signup" },
      { label: "🎥 Interactive Tour", url: "/#demo" },
      { label: "💳 View Pricing Plans", url: "/#pricing" },
    ],
    followUps: [
      "How much does Seat Booking cost?",
      "How does the 2D floor plan designer work?",
      "How do conflict checks prevent double bookings?",
    ],
  }
}
