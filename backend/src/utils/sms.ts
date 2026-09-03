import twilio from "twilio"
import { env } from "@/config/env"

const isConfigured = Boolean(
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER,
)

const client = isConfigured
  ? twilio(env.TWILIO_ACCOUNT_SID as string, env.TWILIO_AUTH_TOKEN as string)
  : null

/**
 * Twilio error codes that mean "the account isn't allowed to message this
 * number" rather than "something is broken":
 *  - 21608: trial accounts can only send to verified numbers
 *  - 21211: the `to` number isn't a valid phone number
 *  - 21606/21659: the `from` number can't send to this destination
 * @see https://www.twilio.com/docs/api/errors
 */
const RECIPIENT_RESTRICTION_CODES = new Set([21211, 21606, 21608, 21659])

interface SendSmsInput {
  to: string
  body: string
}

/**
 * Normalises a free-form phone number to E.164, which Twilio requires.
 *
 * Customer phone numbers are captured as free text (e.g. "+1 555 0101",
 * "(555) 010-1234", "555 0101"), so spaces, dashes, parens and dots are
 * stripped. A leading "00" international prefix is converted to "+". Numbers
 * with no international prefix are prefixed with SMS_DEFAULT_COUNTRY_CODE
 * when configured; without it there's no safe way to guess the country, so
 * the number is rejected rather than sent to the wrong recipient.
 *
 * Returns null when the input can't be confidently normalised.
 */
export function toE164(raw: string, defaultCountryCode = env.SMS_DEFAULT_COUNTRY_CODE): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Keep the "+" if one appears before the first digit — some numbers are
  // written as "(+45) 12 34 56 78" — and drop every other non-digit.
  const firstDigitIndex = trimmed.search(/\d/)
  if (firstDigitIndex === -1) return null
  const hasPlus = trimmed.slice(0, firstDigitIndex).includes("+")
  let digits = trimmed.replace(/\D/g, "")

  if (!digits) return null

  if (hasPlus) {
    return isValidE164Digits(digits) ? `+${digits}` : null
  }

  // "00" is the international access prefix used across much of the world.
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
    return isValidE164Digits(digits) ? `+${digits}` : null
  }

  if (defaultCountryCode) {
    const code = defaultCountryCode.replace(/\D/g, "")
    if (code) {
      // A number that already starts with the country code is assumed to be
      // complete, so it isn't prefixed twice.
      const combined = digits.startsWith(code) ? digits : `${code}${digits}`
      return isValidE164Digits(combined) ? `+${combined}` : null
    }
  }

  return null
}

/** E.164 allows up to 15 digits; anything shorter than 8 isn't a real mobile number. */
function isValidE164Digits(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15
}

/**
 * Sends an SMS via Twilio. If credentials aren't configured (e.g. local
 * development without a Twilio account), the message is logged to the console
 * instead of thrown as an error, so the surrounding flow (reservation
 * creation, token generation) still works and is testable without a provider.
 */
async function sendSms({ to, body }: SendSmsInput) {
  const normalised = toE164(to)

  if (!normalised) {
    // eslint-disable-next-line no-console
    console.warn(
      `[sms] Skipping send: "${to}" could not be normalised to E.164. ` +
        `Set SMS_DEFAULT_COUNTRY_CODE (e.g. "+45") if your customers' numbers are stored without an international prefix.`,
    )
    return
  }

  if (!client) {
    // eslint-disable-next-line no-console
    console.log(
      `[sms] Twilio credentials not set — logging SMS instead of sending.\nTo: ${normalised}\n${body}`,
    )
    return
  }

  try {
    await client.messages.create({
      from: env.TWILIO_PHONE_NUMBER as string,
      to: normalised,
      body,
    })
  } catch (err) {
    const code = (err as { code?: number }).code

    // Twilio trial accounts can only deliver to numbers verified on the
    // account. In development, degrade gracefully: log the message (which
    // includes any action link) instead of failing, so the flow stays
    // testable with arbitrary recipient numbers.
    if (code && RECIPIENT_RESTRICTION_CODES.has(code) && env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[sms] ⚠️ Twilio can't deliver to ${normalised} (code ${code}). On a trial account you can only text numbers verified at twilio.com/console/phone-numbers/verified.\n` +
          `[sms] Logging the message content instead so you can grab the link:\n${body}`,
      )
      return
    }

    // eslint-disable-next-line no-console
    console.error("[sms] Failed to send SMS via Twilio:", err)
    throw new Error("Failed to send SMS")
  }
}

export const sms = {
  sendSms,

  async sendReservationConfirmationSms(input: {
    to: string
    customerName: string
    restaurantName: string
    reservedFor: Date
    partySize: number
    confirmUrl: string
    locale?: string | null
    timezone?: string | null
  }) {
    const { to, customerName, restaurantName, reservedFor, partySize, confirmUrl, locale: rawLocale, timezone: rawTimezone } = input
    const lang = rawLocale?.split(",")[0]?.split("-")[0]?.toLowerCase() || "da"
    const isDa = lang === "da" || lang === "dk"
    const isTr = lang === "tr"

    const resolvedTimezone =
      rawTimezone && rawTimezone !== "UTC"
        ? rawTimezone
        : isDa
          ? "Europe/Copenhagen"
          : isTr
            ? "Europe/Istanbul"
            : "Europe/Copenhagen"

    const dateLocale = isDa ? "da-DK" : isTr ? "tr-TR" : "en-US"
    const when = reservedFor.toLocaleString(dateLocale, {
      timeZone: resolvedTimezone,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

    let body = `Hi ${customerName}, ${restaurantName} has booked you for ${partySize} ${partySize === 1 ? "guest" : "guests"} on ${when}. Confirm: ${confirmUrl}`
    if (isDa) {
      body = `Hej ${customerName}, ${restaurantName} har reserveret bord til ${partySize} ${partySize === 1 ? "gæst" : "gæster"} den ${when}. Bekræft: ${confirmUrl}`
    } else if (isTr) {
      body = `Merhaba ${customerName}, ${restaurantName} sizin için ${when} tarihine ${partySize} kişilik rezervasyon yaptı. Onaylayın: ${confirmUrl}`
    }

    await sendSms({ to, body })
  },
}
