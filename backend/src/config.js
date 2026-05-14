import dotenv from 'dotenv';

dotenv.config();

const splitCsv = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  adminApiKey: process.env.ADMIN_API_KEY || 'change-me',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'replace-with-long-random-secret',
  allowedOrigins: splitCsv(process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000'),
};
