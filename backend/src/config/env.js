import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeyoung_booking',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  defaultMentorTimezone: process.env.DEFAULT_MENTOR_TIMEZONE || 'Asia/Kolkata',
  maxDailyDemosPerMentor: parseInt(process.env.MAX_DAILY_DEMOS_PER_MENTOR || '2', 10),
  demoDurationMinutes: parseInt(process.env.DEMO_DURATION_MINUTES || '45', 10),
};
