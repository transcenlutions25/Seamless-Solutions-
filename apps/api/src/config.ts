import { z } from 'zod';

const configSchema = z.object({
  server: z.object({
    port: z.number().default(3001),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  }),
  database: z.object({
    url: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
  }),
  cors: z.object({
    origin: z.string().default('http://localhost:3000'),
  }),
  stripe: z.object({
    secretKey: z.string(),
    webhookSecret: z.string(),
  }),
  supabase: z.object({
    url: z.string().optional(),
    anonKey: z.string().optional(),
    serviceKey: z.string().optional(),
  }),
  email: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
  }),
  twilio: z.object({
    accountSid: z.string(),
    authToken: z.string(),
    phoneNumber: z.string(),
  }),
  upload: z.object({
    maxFileSize: z.number().default(10485760), // 10MB
    allowedTypes: z.array(z.string()).default([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]),
  }),
});

const rawConfig = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  email: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
  },
};

export const config = configSchema.parse(rawConfig);