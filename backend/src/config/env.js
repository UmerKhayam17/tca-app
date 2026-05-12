require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function loadEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
}

loadEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academy_management',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-prod-32chars',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod-32',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  seedAdminEmail: (process.env.SEED_ADMIN_EMAIL || 'admin@academy.local').toLowerCase().trim(),
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
  seedAdminName: process.env.SEED_ADMIN_NAME || 'System Admin',
  seedAdminPhone: process.env.SEED_ADMIN_PHONE || '00000000000',
  seedAdminResetPassword: process.env.SEED_ADMIN_RESET_PASSWORD === 'true',
};
