/**
 * Schema.org JSON-LD structured data generators for Google Rich Snippets.
 */

export interface RestaurantSchemaOptions {
  name: string
  address?: string | null
  phone?: string | null
  cuisine?: string | null
  openingHours?: string | null
  url?: string | null
  image?: string | null
}

/**
 * Generates SoftwareApplication schema for the SaaS landing page.
 */
export function generateSoftwareAppSchema(baseUrl = "https://seatbooking.com") {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Seat Booking",
    alternateName: "Seat Booking Restaurant Reservation Platform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, macOS, Windows, iOS, Android",
    url: baseUrl,
    description:
      "All-in-one cloud restaurant reservation system featuring interactive 2D floor plan building, real-time table management, guest dietary tracking, and instant online table bookings.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "99",
      offerCount: "3",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Interactive 2D Floor Plan Builder",
      "Real-Time Table Seating and Status Sync",
      "Instant Public Online Guest Bookings",
      "Guest CRM and Dietary Preference Tracking",
      "Automated Reservation Confirmations & Live Notifications",
    ],
  }
}

/**
 * Generates FAQPage schema for Google search results accordion.
 */
export function generateFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does the online restaurant reservation system work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Seat Booking allows restaurants to accept online table bookings 24/7. Guests select their desired date, time, and party size, and can pick an available table directly from the restaurant's floor plan.",
        },
      },
      {
        "@type": "Question",
        name: "Can guests select specific tables on an interactive floor plan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Seat Booking includes an interactive floor plan viewer where guests can see the venue layout and select their preferred table during reservation.",
        },
      },
      {
        "@type": "Question",
        name: "Does Seat Booking support live real-time booking updates for staff?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The platform provides real-time Server-Sent Events (SSE) synchronization. When a new reservation arrives or a status changes, staff dashboards and notification bells update instantly without refreshing.",
        },
      },
      {
        "@type": "Question",
        name: "Does the system track dietary requirements and special requests?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, staff and guests can specify dietary preferences (such as Vegetarian, Vegan, Gluten-Free) and custom special requests like birthday celebrations or high-chair requirements.",
        },
      },
    ],
  }
}

/**
 * Generates FoodEstablishment / Restaurant schema with ReserveAction for public booking pages.
 */
export function generateRestaurantSchema(options: RestaurantSchemaOptions) {
  const url = options.url || "https://seatbooking.com"

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: options.name,
    description: `Online table reservations for ${options.name}. Book your table instantly.`,
    url: url,
    telephone: options.phone || undefined,
    servesCuisine: options.cuisine || "International",
    acceptsReservations: "True",
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: url,
        inLanguage: ["en", "da", "tr"],
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: {
        "@type": "FoodEstablishmentReservation",
        name: `Table reservation at ${options.name}`,
      },
    },
  }
}

/**
 * Generates Organization schema.
 */
export function generateOrganizationSchema(baseUrl = "https://seatbooking.com") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Seat Booking",
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    sameAs: [],
  }
}
