import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Cache transports per sender to avoid re-creating on every send
const transportCache = new Map<string, Transporter>();

/**
 * Get or create an SMTP transporter for an Ethereal sender.
 *
 * No longer used by the send path (see sendEmail below) — kept because
 * senders still carry Ethereal credentials in the database.
 */
export function getTransporter(
  senderId: string,
  etherealUser: string,
  etherealPass: string
): Transporter {
  const cached = transportCache.get(senderId);
  if (cached) return cached;

  const transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: etherealUser,
      pass: etherealPass,
    },
  });

  transportCache.set(senderId, transport);
  return transport;
}

/**
 * Send an email through the Resend HTTP API.
 *
 * The parameter shape is unchanged from the Ethereal implementation so the
 * worker keeps calling this the same way; the ethereal* credentials and
 * senderName/senderEmail are accepted but unused, because Resend sends from
 * the single verified address in RESEND_FROM_EMAIL.
 *
 * previewUrl is always false — Resend delivers real mail, so there is no
 * Ethereal-style preview link.
 */
export async function sendEmail(params: {
  senderId: string;
  etherealUser: string;
  etherealPass: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
}): Promise<{ messageId: string; previewUrl: string | false }> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.resend.fromEmail,
      to: [params.recipientEmail],
      subject: params.subject,
      html: params.body,
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    // Resend errors look like { statusCode, name, message }; fall back to the
    // raw body when it is not JSON (proxy errors, rate-limit HTML, etc).
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; name?: string };
      detail = parsed.message || parsed.name || raw;
    } catch {
      // keep raw
    }

    throw new Error(
      `Resend API error (${response.status}): ${detail || response.statusText}`
    );
  }

  const data = JSON.parse(raw) as { id: string };

  logger.info(`Email sent via Resend: ${data.id} → ${params.recipientEmail}`);

  return {
    messageId: data.id,
    previewUrl: false,
  };
}

/**
 * Create a new Ethereal test account.
 */
export async function createEtherealAccount(): Promise<{
  user: string;
  pass: string;
  email: string;
}> {
  const account = await nodemailer.createTestAccount();
  logger.info(`Ethereal account created: ${account.user}`);
  return {
    user: account.user,
    pass: account.pass,
    email: account.user, // Ethereal user IS the email
  };
}
