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
    // eslint-disable-next-line no-console
    console.error("[mailer] Failed to send email via Resend:", error)
    throw new Error("Failed to send email")
  }
}

export const mailer = {
  sendEmail,

  async sendPasswordResetEmail(to: string, resetUrl: string) {
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
            <a href="${resetUrl}" style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset password
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email — your password won't be changed.
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br />
            <a href="${resetUrl}" style="color: #555; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `,
    })
  },
}
