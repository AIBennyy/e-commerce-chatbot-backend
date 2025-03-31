/**
 * Cookie Management System
 * 
 * Handles cookie storage, retrieval, and refresh for e-commerce platform adapters.
 * This system ensures that cookies are always up-to-date and properly formatted.
 */
const crypto = require('crypto');
const logger = require('./error-monitoring').logger || console;

class CookieManagementSystem {
  constructor() {
    this.cookies = {};
    this.refreshTimers = {};
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key';
    this.lastRefreshTime = {};
  }

  /**
   * Initialize cookies for a specific platform
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @returns {Promise<boolean>} - Success status
   */
  async initializeCookies(platformId) {
    try {
      logger.info(`Initializing cookies for platform: ${platformId}`);
      
      // Get cookies from environment variable
      const cookieEnvVar = `${platformId.toUpperCase()}_COOKIE`;
      const cookieString = process.env[cookieEnvVar];
      
      if (!cookieString) {
        logger.warn(`No cookies found in environment variable ${cookieEnvVar}`);
        return false;
      }
      
      // Store cookies
      this.cookies[platformId] = {
        cookieString,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.getCookieMaxAge(platformId)
      };
      
      // Record last refresh time
      this.lastRefreshTime[platformId] = Date.now();
      
      logger.info(`Cookies initialized for platform: ${platformId}`);
      return true;
    } catch (error) {
      logger.error(`Error initializing cookies for platform ${platformId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get the latest cookies for a specific platform
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @returns {Promise<Object>} - Cookie object with cookieString and metadata
   */
  async getLatestCookies(platformId) {
    try {
      logger.info(`Getting latest cookies for platform: ${platformId}`);
      
      // Check if cookies exist for this platform
      if (!this.cookies[platformId]) {
        // Try to initialize cookies
        const initialized = await this.initializeCookies(platformId);
        if (!initialized) {
          logger.error(`No valid cookies found for ${platformId}`);
          throw new Error(`No valid cookies found for ${platformId}`);
        }
      }
      
      // Check if cookies are expired or close to expiration (within 10 minutes)
      const nearExpiration = this.cookies[platformId].expiresAt < (Date.now() + 10 * 60 * 1000);
      if (this.cookies[platformId].expiresAt < Date.now() || nearExpiration) {
        logger.info(`Cookies for ${platformId} are expired or near expiration, refreshing...`);
        await this.refreshCookies(platformId);
      }
      
      // Check if it's been more than 30 minutes since last refresh for critical operations
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      if (this.lastRefreshTime[platformId] < thirtyMinutesAgo) {
        logger.info(`It's been more than 30 minutes since last cookie refresh for ${platformId}, refreshing...`);
        await this.refreshCookies(platformId);
      }
      
      logger.info(`Retrieved latest cookies for platform: ${platformId}`);
      return this.cookies[platformId];
    } catch (error) {
      logger.error(`Error getting latest cookies for platform ${platformId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh cookies for a specific platform
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @returns {Promise<boolean>} - Success status
   */
  async refreshCookies(platformId) {
    try {
      logger.info(`Refreshing cookies for platform: ${platformId}`);
      
      // For now, just re-initialize from environment variables
      // In a production system, this would use a headless browser to refresh cookies
      const initialized = await this.initializeCookies(platformId);
      
      if (!initialized) {
        logger.error(`Failed to refresh cookies for ${platformId}`);
        return false;
      }
      
      // Update last refresh time
      this.lastRefreshTime[platformId] = Date.now();
      
      logger.info(`Successfully refreshed cookies for ${platformId}`);
      return true;
    } catch (error) {
      logger.error(`Error refreshing cookies for platform ${platformId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Force refresh cookies for a specific platform regardless of expiration
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @returns {Promise<boolean>} - Success status
   */
  async forceRefreshCookies(platformId) {
    try {
      logger.info(`Force refreshing cookies for platform: ${platformId}`);
      return await this.refreshCookies(platformId);
    } catch (error) {
      logger.error(`Error force refreshing cookies for platform ${platformId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Set up automatic cookie refresh for a platform
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @param {number} intervalMs - Refresh interval in milliseconds
   */
  setupAutoRefresh(platformId, intervalMs) {
    // Clear any existing timer
    if (this.refreshTimers[platformId]) {
      clearInterval(this.refreshTimers[platformId]);
    }
    
    // Set up new timer
    this.refreshTimers[platformId] = setInterval(async () => {
      try {
        await this.refreshCookies(platformId);
      } catch (error) {
        logger.error(`Auto-refresh failed for ${platformId}: ${error.message}`);
      }
    }, intervalMs);
    
    logger.info(`Auto-refresh set up for ${platformId} every ${intervalMs}ms`);
  }

  /**
   * Get the maximum age for cookies of a specific platform
   * @param {string} platformId - Platform identifier (e.g., 'motonet', 'sryhma')
   * @returns {number} - Cookie max age in milliseconds
   */
  getCookieMaxAge(platformId) {
    const envVarName = `${platformId.toUpperCase()}_COOKIE_MAX_AGE`;
    const defaultMaxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return parseInt(process.env[envVarName], 10) || defaultMaxAge;
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt sensitive data
   * @param {string} data - Data to decrypt
   * @returns {string} - Decrypted data
   */
  decrypt(data) {
    const textParts = data.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Get cookie status for all platforms
   * @returns {Object} - Status object with platform status
   */
  getStatus() {
    const status = {};
    
    for (const platformId in this.cookies) {
      const cookieData = this.cookies[platformId];
      status[platformId] = {
        exists: !!cookieData,
        expired: cookieData ? cookieData.expiresAt < Date.now() : true,
        expiresAt: cookieData ? new Date(cookieData.expiresAt).toISOString() : null,
        autoRefresh: !!this.refreshTimers[platformId],
        lastRefreshed: this.lastRefreshTime[platformId] ? new Date(this.lastRefreshTime[platformId]).toISOString() : null
      };
    }
    
    return status;
  }
}

// Create singleton instance
const cookieManager = new CookieManagementSystem();

module.exports = cookieManager;
