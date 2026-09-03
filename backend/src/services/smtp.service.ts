import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

// Cache transports per sender to avoid re-creating on every send
const transportCache = new Map<string, Transporter>();

/**
 * Get or create an SMTP transporter for an Ethereal sender.
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
 * Send an email through Ethereal.
 * Returns the Ethereal preview URL.
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
  const transport = getTransporter(
    params.senderId,
    params.etherealUser,
    params.etherealPass
  );

  const info = await transport.sendMail({
    from: `"${params.senderName}" <${params.senderEmail}>`,
    to: params.recipientEmail,
    subject: params.subject,
    html: params.body,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  logger.info(`Email sent: ${info.messageId} — Preview: ${previewUrl}`);

  return {
    messageId: info.messageId,
    previewUrl,
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
