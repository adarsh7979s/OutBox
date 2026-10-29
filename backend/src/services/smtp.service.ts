import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Singleton Gmail SMTP transporter — reused across all sends
let gmailTransport: Transporter | null = null;

/**
 * Get (or lazily create) the shared Gmail SMTP transporter.
 *
 * Uses SMTP_USER + SMTP_PASS from env (a Gmail address and its App Password).
 */
function getGmailTransporter(): Transporter {
  if (gmailTransport) return gmailTransport;

  gmailTransport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // true for 465, false for 587
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return gmailTransport;
}

/**
 * Send an email via Gmail SMTP (nodemailer).
 *
 * The "from" address is always the authenticated Gmail account (SMTP_USER)
 * because Gmail rewrites the From header to match the authenticated sender.
 * The sender's display name from the database is used so recipients see a
 * friendly name.
 *
 * This replaces the previous Resend HTTP API implementation which was
 * restricted to delivering only to the account owner's email in sandbox mode.
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
  const transporter = getGmailTransporter();

  // Gmail always sends from the authenticated account, but we can set a
  // display name so recipients see e.g. "OutBox <you@gmail.com>"
  const fromAddress = params.senderName
    ? `${params.senderName} <${env.smtp.user}>`
    : env.smtp.user;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: params.recipientEmail,
    subject: params.subject,
    html: params.body,
  });

  logger.info(`Email sent via SMTP: ${info.messageId} → ${params.recipientEmail}`);

  return {
    messageId: info.messageId,
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
