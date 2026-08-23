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
      subject: "Reset your Prosisit Table password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; line-height: 1.5;">
            We received a request to reset the password for your Prosisit Table account.
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
      subject: `Confirm your reservation at ${restaurantName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 8px;">You're almost booked, ${safeCustomer}!</h2>
          <p style="color: #555; line-height: 1.5;">
            ${safeRestaurant} has created a reservation for you. Please confirm it below —
            you can also pick your preferred table from the restaurant's floor plan.
          </p>
          <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
            <tr>
              <td style="padding: 6px 0; color: #888; font-size: 14px;">Date &amp; time</td>
              <td style="padding: 6px 0; font-weight: 600; font-size: 14px; text-align: right;">${when}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888; font-size: 14px;">Party size</td>
              <td style="padding: 6px 0; font-weight: 600; font-size: 14px; text-align: right;">${partySize} ${partySize === 1 ? "guest" : "guests"}</td>
            </tr>
            ${
              safeTable
                ? `<tr>
              <td style="padding: 6px 0; color: #888; font-size: 14px;">Table</td>
              <td style="padding: 6px 0; font-weight: 600; font-size: 14px; text-align: right;">${safeTable}</td>
            </tr>`
                : ""
            }
          </table>
          <p style="margin: 24px 0;">
            <a href="${safeConfirmUrl}" style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Confirm reservation
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            On the confirmation page you can optionally choose a different table from the
            restaurant's floor plan before confirming.
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br />
            <a href="${safeConfirmUrl}" style="color: #555; word-break: break-all;">${safeConfirmUrl}</a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            If you didn't expect this reservation, you can ignore this email.
          </p>
        </div>
      `,
    })
  },
}
