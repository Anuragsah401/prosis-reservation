import { Resend } from "resend"
import { env } from "@/config/env"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

/**
 * Sends a transactional email via Resend. If RESEND_API_KEY isn't configured
 * (e.g. local development without an account set up), the email is logged to
 * the console instead of thrown as an error, so the rest of the flow (token
 * creation, etc.) still works and is testable without a real provider.
 */
async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[mailer] RESEND_API_KEY not set — logging email instead of sending.\nTo: ${to}\nSubject: ${subject}\n${html}`)
    return
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  })

  if (error) {
    // Resend sandbox (unverified domain) can only deliver to the account
    // owner's own email. In development, degrade gracefully: log the email
    // content (which includes any action links) instead of failing, so the
    // flow stays testable with arbitrary recipient addresses.
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

export const mailer = {
  sendEmail,

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const escapedResetUrl = escapeHtml(resetUrl)
    await sendEmail({
      to,
      subject: "Reset your Seat Booking password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; line-height: 1.5;">
            We received a request to reset the password for your Seat Booking account.
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <p style="margin: 24px 0;">
            <a href="${escapedResetUrl}" style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset password
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email — your password won't be changed.
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br />
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
  }) {
    const { to, customerName, restaurantName, reservedFor, partySize, tableName, confirmUrl } = input
    const safeCustomer = escapeHtml(customerName)
    const safeRestaurant = escapeHtml(restaurantName)
    const safeTable = tableName ? escapeHtml(tableName) : null
    const safeConfirmUrl = escapeHtml(confirmUrl)

    const when = reservedFor.toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

    await sendEmail({
      to,
      subject: `🍽️ Confirm your reservation at ${restaurantName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #18181b; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);">
          <!-- Header Banner -->
          <div style="background: #18181b; padding: 24px 28px; text-align: left;">
            <div style="display: inline-block; background: #27272a; color: #ffffff; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
              SB
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
              🍽️ Reservation Confirmation
            </h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #18181b;">
              👋 Hi <strong>${safeCustomer}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #52525b;">
              ✨ <strong>${safeRestaurant}</strong> has created a reservation for you. Please confirm your booking details below:
            </p>

            <!-- Details Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
              <table style="border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: middle;">
                    📅 <strong>Date &amp; Time</strong>
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; vertical-align: middle;">
                    ${when}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    👥 <strong>Party Size</strong>
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${partySize} ${partySize === 1 ? "Guest" : "Guests"}
                  </td>
                </tr>
                ${
                  safeTable
                    ? `<tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    🪑 <strong>Table</strong>
                  </td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    ${safeTable}
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px dashed #e2e8f0; vertical-align: middle;">
                    📍 <strong>Restaurant</strong>
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
                ✅ Confirm Reservation →
              </a>
            </div>

            <!-- Interactive Floor Plan Note -->
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                🗺️ <strong>Table Selection:</strong> On the confirmation page, you can preview the restaurant layout and choose your preferred seating.
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              ℹ️ If you did not expect this reservation, you can safely ignore this email.
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
  }) {
    const { to, name, restaurantName, restaurantId } = input
    const safeName = escapeHtml(name)
    const safeRestaurant = restaurantName ? escapeHtml(restaurantName) : null
    const dashboardUrl = `${env.APP_URL}/dashboard`
    const escapedDashboardUrl = escapeHtml(dashboardUrl)
    const bookingUrl = restaurantId ? `${env.APP_URL}/restaurant/${restaurantId}/book` : null
    const escapedBookingUrl = bookingUrl ? escapeHtml(bookingUrl) : null

    await sendEmail({
      to,
      subject: `🎉 Welcome to Seat Booking, ${safeName}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #18181b; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);">
          <!-- Header Banner -->
          <div style="background: #18181b; padding: 24px 28px; text-align: left;">
            <div style="display: inline-block; background: #27272a; color: #ffffff; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 15px; margin-bottom: 8px;">
              SB
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
              ✨ Welcome to Seat Booking!
            </h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0; color: #18181b;">
              👋 Hi <strong>${safeName}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #52525b;">
              🎉 Thank you for joining <strong>Seat Booking</strong>!
              ${
                safeRestaurant
                  ? `Your restaurant <strong>${safeRestaurant}</strong> is set up and ready to accept table reservations.`
                  : "Your account is ready to manage table bookings, floor plans, and dining capacity."
              }
            </p>

            <!-- Quick Start Feature Cards -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                🚀 Quick Start Checklist
              </h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">🗺️</span>
                  <strong style="font-size: 14px; color: #0f172a;">2D Floor Plan Designer:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    Build custom table layouts, shapes, and seating capacities.
                  </div>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">📅</span>
                  <strong style="font-size: 14px; color: #0f172a;">Real-Time Table Management:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    Track live reservations, take phone bookings, and manage walk-ins.
                  </div>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 16px; margin-right: 6px;">🥗</span>
                  <strong style="font-size: 14px; color: #0f172a;">Guest Preferences &amp; Dietary:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    Record dietary tags (Vegetarian, Gluten-Free) and celebration requests (🎂 Birthday, 🥂 Anniversary).
                  </div>
                </div>
                ${
                  escapedBookingUrl
                    ? `<div>
                  <span style="font-size: 16px; margin-right: 6px;">🔗</span>
                  <strong style="font-size: 14px; color: #0f172a;">24/7 Online Booking Link:</strong>
                  <div style="font-size: 13px; color: #475569; margin-top: 2px; padding-left: 26px;">
                    Accept reservations directly from your website, Instagram, and Google.
                  </div>
                </div>`
                    : ""
                }
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 24px;">
              <a href="${escapedDashboardUrl}" style="background: #18181b; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">
                🚀 Open Your Dashboard →
              </a>
            </div>

            ${
              escapedBookingUrl
                ? `
            <!-- Public Booking Link Box -->
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
              <p style="font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                🌐 Your Public Guest Booking Link:
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
              💬 Need help or have questions? Simply reply to this email anytime — we're here to help!
            </p>
          </div>
        </div>
      `,
    })
  },
}
