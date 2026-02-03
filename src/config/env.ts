import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Validate required variables
const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
  'JWT_SECRET'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = {
  port: process.env.PORT || '3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/freshdrops_approval',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID as string,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN as string,
  twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM as string,
  webhookUrl: process.env.WEBHOOK_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  frontendUrl: process.env.FRONTEND_URL as string,
  superApproverPhone: process.env.SUPER_APPROVER_PHONE as string,
  twilioSmsFrom: process.env.TWILIO_SMS_FROM as string,

};

console.log('✅ Environment variables loaded successfully');