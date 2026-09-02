import { Resend } from "resend"
import { env } from "@/config/env"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export type SupportedLocale = "da" | "tr" | "en"

export function normalizeLocale(locale?: string | null): SupportedLocale {
  if (!locale) return "da"
  const code = locale.split(",")[0]?.split("-")[0]?.toLowerCase().trim()
  if (code === "da" || code === "dk") return "da"
  if (code === "tr") return "tr"
  if (code === "en") return "en"
  return "da"
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

/** Extracts the clean email address from EMAIL_FROM and pairs it with the restaurant's display name. */
function formatSender(displayName?: string): string {
  const match = env.EMAIL_FROM.match(/<([^>]+)>/)
  const emailOnly = match ? match[1] : env.EMAIL_FROM.trim()
  if (displayName) {
    const cleanName = displayName.replace(/["<>]/g, "").trim()
    return `"${cleanName}" <${emailOnly}>`
  }
  return env.EMAIL_FROM
}

/**
 * Sends a transactional email via Resend with plain-text fallback and retry safety.
 */
async function sendEmail({ to, subject, html, text, from, replyTo }: SendEmailInput) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[mailer] RESEND_API_KEY not set — logging email instead of sending.\nTo: ${to}\nSubject: ${subject}\n${html}`)
    return
  }

  const sender = from || env.EMAIL_FROM
  const plainText = text || htmlToPlainText(html)

  const { error } = await resend.emails.send({
    from: sender,
    to,
    subject,
    html,
    text: plainText,
    replyTo: replyTo || sender,
  })

  if (error) {
    const isSandboxRestriction = error.name === "validation_error" && /verify a domain/i.test(error.message)
    if (isSandboxRestriction && env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[mailer] ⚠️ Resend sandbox: can't deliver to ${to} (only your own Resend account email works until you verify a domain at resend.com/domains).\n` +
          `[mailer] Logging the email content instead so you can grab the link:\nSubject: ${subject}\n${extractLinks(html)}`,
      )
      return
    }

    // eslint-disable-next-line no-console
    console.error("[mailer] Failed to send email via Resend:", error)
    throw new Error("Failed to send email")
  }
}

/** Pulls href links out of an HTML email so dev logs stay readable. */
function extractLinks(html: string): string {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
  return links.length > 0 ? `Links:\n${[...new Set(links)].join("\n")}` : html
}

/** Sanitizes text to prevent HTML injection in transactional email templates. */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const RESERVATION_CONFIRMATION_I18N = {
  da: {
    subject: (name: string) => `🍽️ Bekræft din reservation hos ${name}`,
    headerTitle: "🍽️ Reservationsbekræftelse",
    greeting: (name: string) => `👋 Hej <strong>${name}</strong>,`,
    intro: (name: string) => `✨ <strong>${name}</strong> har oprettet en reservation til dig. Bekræft venligst dine oplysninger nedenfor:`,
    dateTimeLabel: "📅 Dato &amp; tidspunkt",
    partySizeLabel: "👥 Antal gæster",
    guestUnit: (count: number) => (count === 1 ? "Gæst" : "Gæster"),
    tableLabel: "🪑 Bord",
    restaurantLabel: "📍 Restaurant",
    buttonCta: "✅ Bekræft reservation →",
    floorPlanTip: "🗺️ <strong>Bordvalg:</strong> På bekræftelsessiden kan du se restaurantens bordplan og vælge din foretrukne plads.",
    footerNotice: "ℹ️ Hvis du ikke forventede denne reservation, kan du roligt ignorere denne e-mail.",
    dateLocale: "da-DK",
  },
  tr: {
    subject: (name: string) => `🍽️ ${name} restoranındaki rezervasyonunuzu onaylayın`,
    headerTitle: "🍽️ Rezervasyon Onayı",
    greeting: (name: string) => `👋 Merhaba <strong>${name}</strong>,`,
    intro: (name: string) => `✨ <strong>${name}</strong> sizin için bir rezervasyon oluşturdu. Lütfen aşağıdaki rezervasyon detaylarınızı onaylayın:`,
    dateTimeLabel: "📅 Tarih ve Saat",
    partySizeLabel: "👥 Kişi Sayısı",
    guestUnit: (count: number) => `${count} Kişi`,
    tableLabel: "🪑 Masa",
    restaurantLabel: "📍 Restoran",
    buttonCta: "✅ Rezervasyonu Onayla →",
    floorPlanTip: "🗺️ <strong>Masa Seçimi:</strong> Onay sayfasında restoranın masa planını inceleyebilir ve oturma yerinizi seçebilirsiniz.",
    footerNotice: "ℹ️ Bu rezervasyonu siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz.",
    dateLocale: "tr-TR",
  },
  en: {
    subject: (name: string) => `🍽️ Confirm your reservation at ${name}`,
    headerTitle: "🍽️ Reservation Confirmation",
    greeting: (name: string) => `👋 Hi <strong>${name}</strong>,`,
    intro: (name: string) => `✨ <strong>${name}</strong> has created a reservation for you. Please confirm your booking details below:`,
    dateTimeLabel: "📅 Date &amp; Time",
    partySizeLabel: "👥 Party Size",
    guestUnit: (count: number) => (count === 1 ? "Guest" : "Guests"),
    tableLabel: "🪑 Table",
    restaurantLabel: "📍 Restaurant",
    buttonCta: "✅ Confirm Reservation →",
    floorPlanTip: "🗺️ <strong>Table Selection:</strong> On the confirmation page, you can preview the restaurant layout and choose your preferred seating.",
    footerNotice: "ℹ️ If you did not expect this reservation, you can safely ignore this email.",
    dateLocale: "en-US",
  },
} as const

const PASSWORD_RESET_I18N = {
  da: {
    subject: "Nulstil din adgangskode til Seat Booking",
    title: "Nulstil din adgangskode",
    desc: "Vi har modtaget en anmodning om at nulstille adgangskoden til din Seat Booking-konto. Klik på knappen nedenfor for at vælge en ny adgangskode. Dette link udløber om 1 time.",
    button: "Nulstil adgangskode",
    ignore: "Hvis du ikke har anmodet om dette, kan du roligt ignorere denne e-mail — din adgangskode vil ikke blive ændret.",
    orCopy: "Eller kopiér og indsæt dette link i din browser:",
  },
  tr: {
    subject: "Seat Booking şifrenizi sıfırlayın",
    title: "Şifrenizi sıfırlayın",
    desc: "Seat Booking hesabınız için bir şifre sıfırlama talebi aldık. Yeni bir şifre seçmek için aşağıdaki butona tıklayın. Bu bağlantının süresi 1 saat içinde dolacaktır.",
    button: "Şifreyi sıfırla",
    ignore: "Bu talebi siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz — şifreniz değişmeyecektir.",
    orCopy: "Veya bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:",
  },
  en: {
    subject: "Reset your Seat Booking password",
    title: "Reset your password",
    desc: "We received a request to reset the password for your Seat Booking account. Click the button below to choose a new password. This link expires in 1 hour.",
    button: "Reset password",
    ignore: "If you didn't request this, you can safely ignore this email — your password won't be changed.",
    orCopy: "Or copy and paste this link into your browser:",
  },
} as const

const WELCOME_I18N = {
  da: {
    subject: (name: string) => `🎉 Velkommen til Seat Booking, ${name}!`,
    title: "✨ Velkommen til Seat Booking!",
    greeting: (name: string) => `👋 Hej <strong>${name}</strong>,`,
    introRestaurant: (name: string) => `Din restaurant <strong>${name}</strong> er konfigureret og klar til at modtage bordreservationer.`,
    introAccount: "Din konto er klar til at administrere bordreservationer, bordplaner og kapacitet.",
    checklistTitle: "🚀 Hurtig start-tjekliste",
    floorPlanTitle: "2D Bordplan Designer",
    floorPlanDesc: "Byg tilpassede bordlayouts, former og siddekapaciteter.",
    tableMgmtTitle: "Bordstyring i realtid",
    tableMgmtDesc: "Følg reservationer live, modtag telefonbookinger og håndter walk-ins.",
    preferencesTitle: "Gæstepræferencer & Allergener",
    preferencesDesc: "Gem kostpræferencer (vegetar, glutenfri) og mærkedage (🎂 fødselsdag, 🥂 jubilæum).",
    onlineBookingTitle: "24/7 Online Booking Link",
    onlineBookingDesc: "Modtag reservationer direkte fra din hjemmeside, Instagram og Google.",
    dashboardBtn: "🚀 Åbn dit dashboard →",
    publicBookingLabel: "🌐 Dit offentlige bookinglink til gæster:",
    helpFooter: "💬 Har du spørgsmål eller brug for hjælp? Svar blot på denne e-mail — vi sidder altid klar til at hjælpe!",
  },
  tr: {
    subject: (name: string) => `🎉 Seat Booking'e hoş geldiniz, ${name}!`,
    title: "✨ Seat Booking'e Hoş Geldiniz!",
    greeting: (name: string) => `👋 Merhaba <strong>${name}</strong>,`,
    introRestaurant: (name: string) => `<strong>${name}</strong> restoranınız hazır ve masa rezervasyonlarını kabul etmeye başladı.`,
    introAccount: "Hesabınız masa rezervasyonlarını, yerleşim planlarını ve kapasiteyi yönetmeye hazır.",
    checklistTitle: "🚀 Hızlı Başlangıç Rehberi",
    floorPlanTitle: "2D Masa Planı Tasarımcısı",
    floorPlanDesc: "Özel masa düzenleri, şekilleri ve oturma kapasiteleri oluşturun.",
    tableMgmtTitle: "Gerçek Zamanlı Masa Yönetimi",
    tableMgmtDesc: "Canlı rezervasyonları takip edin, telefon rezervasyonları alın ve anlık misafirleri yönetin.",
    preferencesTitle: "Misafir Tercihleri ve Diyet Bilgileri",
    preferencesDesc: "Diyet etiketlerini (Vejetaryen, Glutensiz) ve kutlamaları (🎂 Doğum günü, 🥂 Yıldönümü) kaydedin.",
    onlineBookingTitle: "7/24 Online Rezervasyon Linki",
    onlineBookingDesc: "Web sitenizden, Instagram'dan ve Google'dan doğrudan rezervasyon alın.",
    dashboardBtn: "🚀 Kontrol Panelinizi Açın →",
    publicBookingLabel: "🌐 Misafirler İçin Genel Rezervasyon Linkiniz:",
    helpFooter: "💬 Sorularınız mı var? İstediğiniz zaman bu e-postayı yanıtlayabilirsiniz — yardımcı olmaktan mutluluk duyarız!",
  },
  en: {
    subject: (name: string) => `🎉 Welcome to Seat Booking, ${name}!`,
    title: "✨ Welcome to Seat Booking!",
    greeting: (name: string) => `👋 Hi <strong>${name}</strong>,`,
    introRestaurant: (name: string) => `Your restaurant <strong>${name}</strong> is set up and ready to accept table reservations.`,
    introAccount: "Your account is ready to manage table bookings, floor plans, and dining capacity.",
    checklistTitle: "🚀 Quick Start Checklist",
    floorPlanTitle: "2D Floor Plan Designer",
    floorPlanDesc: "Build custom table layouts, shapes, and seating capacities.",
    tableMgmtTitle: "Real-Time Table Management",
    tableMgmtDesc: "Track live reservations, take phone bookings, and manage walk-ins.",
    preferencesTitle: "Guest Preferences & Dietary",
    preferencesDesc: "Record dietary tags (Vegetarian, Gluten-Free) and celebration requests (🎂 Birthday, 🥂 Anniversary).",
    onlineBookingTitle: "24/7 Online Booking Link",
    onlineBookingDesc: "Accept reservations directly from your website, Instagram, and Google.",
    dashboardBtn: "🚀 Open Your Dashboard →",
    publicBookingLabel: "🌐 Your Public Guest Booking Link:",
    helpFooter: "💬 Need help or have questions? Simply reply to this email anytime — we're here to help!",
  },
} as const

export const mailer = {
  sendEmail,

  async sendPasswordResetEmail(to: string, resetUrl: string, rawLocale?: string | null) {
    const locale = normalizeLocale(rawLocale)
    const t = PASSWORD_RESET_I18N[locale] ?? PASSWORD_RESET_I18N.da
    const escapedResetUrl = escapeHtml(resetUrl)

    await sendEmail({
      to,
      subject: t.subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">${t.title}</h2>
          <p style="color: #555; line-height: 1.5;">
            ${t.desc}
          </p>
          <p style="margin: 24px 0;">
            <a href="${escapedResetUrl}" style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              ${t.button}
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            ${t.ignore}
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            ${t.orCopy}<br />
            <a href="${escapedResetUrl}" style="color: #555; word-break: break-all;">${escapedResetUrl}</a>
          </p>
        </div>
      `,
    })
  },

  async sendReservationConfirmationEmail(input: {
    to: string
    customerName: string
    restaurantName: string
    reservedFor: Date
    partySize: number
    tableName?: string | null
    confirmUrl: string
    locale?: string | null
  }) {
    const { to, customerName, restaurantName, reservedFor, partySize, tableName, confirmUrl, locale: rawLocale } = input
    const locale = normalizeLocale(rawLocale)
    const t = RESERVATION_CONFIRMATION_I18N[locale] ?? RESERVATION_CONFIRMATION_I18N.da

    const safeCustomer = escapeHtml(customerName)
    const safeRestaurant = escapeHtml(restaurantName)
    const safeTable = tableName ? escapeHtml(tableName) : null
    const safeConfirmUrl = escapeHtml(confirmUrl)

    const when = reservedFor.toLocaleString(t.dateLocale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

    const partyText = typeof t.guestUnit === "function" ? `${partySize} ${t.guestUnit(partySize)}` : `${partySize}`

    await sendEmail({
      from: formatSender(restaurantName),
      to,
      subject: t.subject(restaurantName),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #18181b; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);">
          <!-- Header Banner -->
          <div style="background: #18181b; padding: 24px 28px; text-align: left;">
            <div style="display: inline-block; background: #27272a; color: #ffffff; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
              SB
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
              ${t.headerTitle}
            </h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #18181b;">
              ${t.greeting(safeCustomer)}
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #52525b;">
              ${t.intro(safeRestaurant)}
            </p>

            <!-- Details Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
              <table style="border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: middle;">
                    ${t.dateTimeLabel}
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; vertical-align: middle;">
                    ${when}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${t.partySizeLabel}
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${partyText}
                  </td>
                </tr>
                ${
                  safeTable
                    ? `<tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${t.tableLabel}
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${safeTable}
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${t.restaurantLabel}
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${safeRestaurant}
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${safeConfirmUrl}" style="background: #18181b; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">
                ${t.buttonCta}
              </a>
            </div>

            <!-- Interactive Floor Plan Note -->
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                ${t.floorPlanTip}
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              ${t.footerNotice}
            </p>
          </div>
        </div>
      `,
    })
  },

  async sendWelcomeEmail(input: {
    to: string
    name: string
    restaurantName?: string | null
    restaurantId?: string | null
    locale?: string | null
  }) {
    const { to, name, restaurantName, restaurantId, locale: rawLocale } = input
    const locale = normalizeLocale(rawLocale)
    const t = WELCOME_I18N[locale] ?? WELCOME_I18N.da

    const safeName = escapeHtml(name)
    const safeRestaurant = restaurantName ? escapeHtml(restaurantName) : null
    const dashboardUrl = `${env.APP_URL}/dashboard`
    const escapedDashboardUrl = escapeHtml(dashboardUrl)
    const bookingUrl = restaurantId ? `${env.APP_URL}/restaurant/${restaurantId}/book` : null
    const escapedBookingUrl = bookingUrl ? escapeHtml(bookingUrl) : null

    await sendEmail({
      to,
      subject: t.subject(safeName),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #18181b; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);">
          <!-- Header Banner -->
          <div style="background: #18181b; padding: 24px 28px; text-align: left;">
            <div style="display: inline-block; background: #27272a; color: #ffffff; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
              SB
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
              ${t.title}
            </h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #18181b;">
              ${t.greeting(safeName)}
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #52525b;">
              🎉 ${
                safeRestaurant
                  ? t.introRestaurant(safeRestaurant)
                  : t.introAccount
              }
            </p>

            <!-- Quick Start Feature Cards -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                ${t.checklistTitle}
              </h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">🗺️</span>
                  <strong style="font-size: 14px; color: #0f172a;">${t.floorPlanTitle}:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    ${t.floorPlanDesc}
                  </div>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">📅</span>
                  <strong style="font-size: 14px; color: #0f172a;">${t.tableMgmtTitle}:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    ${t.tableMgmtDesc}
                  </div>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">🥗</span>
                  <strong style="font-size: 14px; color: #0f172a;">${t.preferencesTitle}:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    ${t.preferencesDesc}
                  </div>
                </div>
                ${
                  escapedBookingUrl
                    ? `<div>
                  <span style="font-size: 16px; margin-right: 6px;">🔗</span>
                  <strong style="font-size: 14px; color: #0f172a;">${t.onlineBookingTitle}:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    ${t.onlineBookingDesc}
                  </div>
                </div>`
                    : ""
                }
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 24px;">
              <a href="${escapedDashboardUrl}" style="background: #18181b; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">
                ${t.dashboardBtn}
              </a>
            </div>

            ${
              escapedBookingUrl
                ? `
            <!-- Public Booking Link Box -->
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
              <p style="font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                ${t.publicBookingLabel}
              </p>
              <a href="${escapedBookingUrl}" style="font-size: 13px; color: #2563eb; font-weight: 500; word-break: break-all; text-decoration: none;">
                ${escapedBookingUrl}
              </a>
            </div>
            `
                : ""
            }

            <!-- Footer Help -->
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              ${t.helpFooter}
            </p>
          </div>
        </div>
      `,
    })
  },
}
