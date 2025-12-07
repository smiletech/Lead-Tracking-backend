import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5002,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
};
