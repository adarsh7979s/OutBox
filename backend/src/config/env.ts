import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().default(''),

  ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:4000/api/auth/google/callback'),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  SLACK_CLIENT_ID: z.string().default(''),
  SLACK_CLIENT_SECRET: z.string().default(''),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:4000/api/slack/callback'),

  WORKER_CONCURRENCY: z.string().default('5'),
  MIN_SEND_DELAY_MS: z.string().default('2000'),

  MAX_EMAILS_PER_HOUR: z.string().default('200'),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.string().default('50'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),

  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_EMAIL: z.string().default(''),

  // Gmail SMTP (used for actual email delivery)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  corsOrigin: parsed.data.CORS_ORIGIN,
  // CORS_ORIGIN accepts a comma-separated list so production and preview
  // frontends can be allowed without code changes.
  corsOrigins: parsed.data.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  databaseUrl: parsed.data.DATABASE_URL,

  redis: {
    // Providers like Upstash hand out a single connection URL
    // (rediss://default:<password>@host:6379). When present it wins over
    // the discrete host/port/password used for local development.
    url: parsed.data.REDIS_URL || undefined,
    host: parsed.data.REDIS_HOST,
    port: parseInt(parsed.data.REDIS_PORT, 10),
    password: parsed.data.REDIS_PASSWORD || undefined,
  },

  elasticsearchUrl: parsed.data.ELASTICSEARCH_URL,

  google: {
    clientId: parsed.data.GOOGLE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsed.data.GOOGLE_CALLBACK_URL,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },

  slack: {
    clientId: parsed.data.SLACK_CLIENT_ID,
    clientSecret: parsed.data.SLACK_CLIENT_SECRET,
    redirectUri: parsed.data.SLACK_REDIRECT_URI,
  },

  worker: {
    concurrency: parseInt(parsed.data.WORKER_CONCURRENCY, 10),
    minSendDelayMs: parseInt(parsed.data.MIN_SEND_DELAY_MS, 10),
  },

  rateLimit: {
    maxPerHour: parseInt(parsed.data.MAX_EMAILS_PER_HOUR, 10),
    maxPerHourPerSender: parseInt(parsed.data.MAX_EMAILS_PER_HOUR_PER_SENDER, 10),
  },

  frontendUrl: parsed.data.FRONTEND_URL,

  resend: {
    apiKey: parsed.data.RESEND_API_KEY,
    fromEmail: parsed.data.RESEND_FROM_EMAIL,
  },

  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parseInt(parsed.data.SMTP_PORT, 10),
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
  },
};
