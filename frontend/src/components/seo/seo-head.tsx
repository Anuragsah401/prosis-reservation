import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export interface SEOHeadProps {
  /** Page title. Automatically appended with site brand if not already present. */
  title?: string
  /** 150-160 character description optimized for search engine snippets. */
  description?: string
  /** Comma-separated list of keywords. */
  keywords?: string
  /** Canonical URL for the page. Defaults to current path. */
  canonicalPath?: string
  /** OpenGraph image URL for social previews. */
  ogImage?: string
  /** OpenGraph type. */
  ogType?: "website" | "article" | "restaurant.restaurant"
  /** Robots directive. Use 'noindex, nofollow' on private pages. */
  robots?: "index, follow" | "noindex, nofollow" | "noindex, follow"
  /** Structured data JSON-LD object or array of objects. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

const DEFAULT_SITE_TITLE = "Seat Booking"
const DEFAULT_DESCRIPTION =
  "Modern online restaurant table reservation and interactive floor plan management platform. Real-time booking, guest CRM, and smart seating."
const DEFAULT_KEYWORDS =
  "restaurant reservation system, table booking software, floor plan designer, restaurant management, online reservation, table planner, seat booking"
const DEFAULT_OG_IMAGE = "/favicon.svg"

function setOrCreateMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute("content", content)
}

function setOrCreateLink(rel: string, href: string, extraAttributes: Record<string, string> = {}) {
  let selector = `link[rel="${rel}"]`
  if (extraAttributes.hreflang) {
    selector += `[hreflang="${extraAttributes.hreflang}"]`
  }
  let element = document.querySelector(selector) as HTMLLinkElement | null
  if (!element) {
    element = document.createElement("link")
    element.setAttribute("rel", rel)
    Object.entries(extraAttributes).forEach(([k, v]) => element?.setAttribute(k, v))
    document.head.appendChild(element)
  }
  element.setAttribute("href", href)
}

/**
 * Head metadata manager for high-impact SEO, OpenGraph cards, Twitter previews,
 * hreflang localization, and Schema.org JSON-LD structured data.
 */
export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  robots = "index, follow",
  jsonLd,
}: SEOHeadProps) {
  const { i18n } = useTranslation()

  useEffect(() => {
    // 1. Title
    const formattedTitle = title
      ? title.includes(DEFAULT_SITE_TITLE)
        ? title
        : `${title} | ${DEFAULT_SITE_TITLE}`
      : `${DEFAULT_SITE_TITLE} - Restaurant Table Reservation & Floor Plan System`
    document.title = formattedTitle

    // 2. HTML lang attribute
    const currentLang = i18n.language ? i18n.language.slice(0, 2) : "en"
    document.documentElement.lang = currentLang

    // 3. Standard SEO Meta
    setOrCreateMeta("name", "description", description)
    setOrCreateMeta("name", "keywords", keywords)
    setOrCreateMeta("name", "robots", robots)
    setOrCreateMeta("name", "theme-color", "#18181b")

    // 4. OpenGraph Tags
    const origin = window.location.origin
    const currentUrl = canonicalPath ? `${origin}${canonicalPath}` : window.location.href
    const fullOgImage = ogImage.startsWith("http") ? ogImage : `${origin}${ogImage}`

    setOrCreateMeta("property", "og:title", formattedTitle)
    setOrCreateMeta("property", "og:description", description)
    setOrCreateMeta("property", "og:url", currentUrl)
    setOrCreateMeta("property", "og:type", ogType)
    setOrCreateMeta("property", "og:image", fullOgImage)
    setOrCreateMeta("property", "og:site_name", DEFAULT_SITE_TITLE)
    setOrCreateMeta("property", "og:locale", currentLang === "da" ? "da_DK" : currentLang === "tr" ? "tr_TR" : "en_US")

    // 5. Twitter Card Tags
    setOrCreateMeta("name", "twitter:card", "summary_large_image")
    setOrCreateMeta("name", "twitter:title", formattedTitle)
    setOrCreateMeta("name", "twitter:description", description)
    setOrCreateMeta("name", "twitter:image", fullOgImage)

    // 6. Canonical Link
    setOrCreateLink("canonical", currentUrl)

    // 7. Hreflang alternates
    const pathname = canonicalPath || window.location.pathname
    setOrCreateLink("alternate", `${origin}${pathname}?lng=en`, { hreflang: "en" })
    setOrCreateLink("alternate", `${origin}${pathname}?lng=da`, { hreflang: "da" })
    setOrCreateLink("alternate", `${origin}${pathname}?lng=tr`, { hreflang: "tr" })
    setOrCreateLink("alternate", `${origin}${pathname}`, { hreflang: "x-default" })

    // 8. Structured Data (JSON-LD)
    const scriptId = "seo-jsonld-script"
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null

    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script")
        scriptEl.id = scriptId
        scriptEl.type = "application/ld+json"
        document.head.appendChild(scriptEl)
      }
      scriptEl.textContent = JSON.stringify(jsonLd)
    } else if (scriptEl) {
      scriptEl.remove()
    }

    return () => {
      // Optional cleanup on unmount if needed
    }
  }, [title, description, keywords, canonicalPath, ogImage, ogType, robots, jsonLd, i18n.language])

  return null
}
