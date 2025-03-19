/**
 * Configuration for the cookie management system
 */
require('dotenv').config();

module.exports = {
  // Database configuration
  database: {
    path: process.env.DB_PATH || './cookies.db',
  },
  
  // Encryption configuration
  encryption: {
    secret: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
  },
  
  // Scheduler configuration
  scheduler: {
    // Run cookie refresh every 12 hours by default
    refreshInterval: process.env.REFRESH_INTERVAL || '0 */12 * * *',
    // Maximum retry attempts for cookie refresh
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    // Delay between retries in milliseconds
    retryDelay: parseInt(process.env.RETRY_DELAY || '60000', 10),
  },
  
  // Platform-specific configurations
  platforms: {
    motonet: {
      url: process.env.MOTONET_URL || 'https://www.motonet.fi',
      loginRequired: false,
      username: process.env.MOTONET_USERNAME || '',
      password: process.env.MOTONET_PASSWORD || '',
      cookieMaxAge: parseInt(process.env.MOTONET_COOKIE_MAX_AGE || '86400000', 10), // 24 hours in milliseconds
      essentialCookies: ['cartId', 'puid', 'first_session'],
    },
    smarket: {
      url: process.env.SMARKET_URL || 'https://www.s-kaupat.fi',
      loginRequired: true,
      username: process.env.SMARKET_USERNAME || '',
      password: process.env.SMARKET_PASSWORD || '',
      cookieMaxAge: parseInt(process.env.SMARKET_COOKIE_MAX_AGE || '86400000', 10),
      essentialCookies: [], // To be determined
    },
    gigantti: {
      url: process.env.GIGANTTI_URL || 'https://www.gigantti.fi',
      loginRequired: false,
      username: process.env.GIGANTTI_USERNAME || '',
      password: process.env.GIGANTTI_PASSWORD || '',
      cookieMaxAge: parseInt(process.env.GIGANTTI_COOKIE_MAX_AGE || '86400000', 10),
      essentialCookies: [], // To be determined
    },
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './cookie-manager.log',
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
  },
};
