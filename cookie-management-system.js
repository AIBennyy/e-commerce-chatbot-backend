/**
 * Cookie Management System
 * Handles cookie storage, retrieval, and refresh for e-commerce platform adapters
 */
const crypto = require('crypto');

class CookieManagementSystem {
  constructor() {
    this.cookies = {};
    this.initialized = false;
    this.initialize();
  }

  /**
   * Initialize the cookie management system
   * Load cookies from environment variables
   */
  initialize() {
    try {
      console.log('Initializing cookie management system');
      
      // Load cookies from environment variables
      this.loadCookiesFromEnv();
      
      this.initialized = true;
      console.log('Cookie management system initialized successfully');
    } catch (error) {
      console.error('Error initializing cookie management system:', error);
      throw error;
    }
  }

  /**
   * Load cookies from environment variables
   */
  loadCookiesFromEnv() {
    try {
      console.log('Loading cookies from environment variables');
      
      // Load Motonet cookies
      const motonetCookie = process.env.MOTONET_COOKIE;
      if (motonetCookie) {
        console.log('Found Motonet cookies in environment variables');
        this.setCookies('motonet', motonetCookie);
      } else {
        console.warn('No Motonet cookies found in environment variables');
      }
      
      // Add other platforms here as needed
      
    } catch (error) {
      console.error('Error loading cookies from environment variables:', error);
      throw error;
    }
  }

  /**
   * Set cookies for a platform
   * @param {string} platformId - Platform identifier
   * @param {string} cookieString - Cookie string
   */
  setCookies(platformId, cookieString) {
    try {
      console.log(`Setting cookies for platform: ${platformId}`);
      
      // Remove "Cookie: " prefix if present
      const cleanCookieString = cookieString.startsWith('Cookie: ') 
        ? cookieString.substring(8) 
        : cookieString;
      
      this.cookies[platformId] = {
        cookieString: cleanCookieString,
        timestamp: Date.now(),
        parsed: this.parseCookieString(cleanCookieString)
      };
      
      console.log(`Cookies set for platform: ${platformId}`);
      return true;
    } catch (error) {
      console.error(`Error setting cookies for platform ${platformId}:`, error);
      return false;
    }
  }

  /**
   * Parse cookie string into object
   * @param {string} cookieString - Cookie string
   * @returns {Object} - Parsed cookies
   */
  parseCookieString(cookieString) {
    try {
      const cookies = {};
      const cookiePairs = cookieString.split(';');
      
      for (const pair of cookiePairs) {
        const [name, value] = pair.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      }
      
      return cookies;
    } catch (error) {
      console.error('Error parsing cookie string:', error);
      return {};
    }
  }

  /**
   * Get the latest cookies for a platform
   * @param {string} platformId - Platform identifier
   * @returns {Object|null} - Cookie data or null if not found
   */
  getLatestCookies(platformId) {
    try {
      console.log(`Getting latest cookies for platform: ${platformId}`);
      
      if (!this.initialized) {
        console.log('Cookie management system not initialized, initializing now');
        this.initialize();
      }
      
      if (!this.cookies[platformId]) {
        console.warn(`No cookies found for platform: ${platformId}`);
        return null;
      }
      
      // Check if cookies are expired
      const cookieData = this.cookies[platformId];
      const now = Date.now();
      const maxAge = process.env[`${platformId.toUpperCase()}_COOKIE_MAX_AGE`] || 86400000; // Default: 24 hours
      
      if (now - cookieData.timestamp > maxAge) {
        console.warn(`Cookies for platform ${platformId} are expired`);
        // Try to refresh cookies
        this.loadCookiesFromEnv();
        
        // Check if refresh was successful
        if (!this.cookies[platformId] || now - this.cookies[platformId].timestamp > maxAge) {
          console.error(`Failed to refresh expired cookies for platform ${platformId}`);
          return null;
        }
      }
      
      console.log(`Retrieved latest cookies for platform: ${platformId}`);
      return this.cookies[platformId];
    } catch (error) {
      console.error(`Error getting latest cookies for platform ${platformId}:`, error);
      return null;
    }
  }

  /**
   * Refresh cookies for a platform
   * @param {string} platformId - Platform identifier
   * @returns {boolean} - Success status
   */
  refreshCookies(platformId) {
    try {
      console.log(`Refreshing cookies for platform: ${platformId}`);
      
      // For now, just reload from environment variables
      this.loadCookiesFromEnv();
      
      if (!this.cookies[platformId]) {
        console.warn(`No cookies found for platform ${platformId} after refresh`);
        return false;
      }
      
      console.log(`Successfully refreshed cookies for platform: ${platformId}`);
      return true;
    } catch (error) {
      console.error(`Error refreshing cookies for platform ${platformId}:`, error);
      return false;
    }
  }
}

// Create singleton instance
const cookieManager = new CookieManagementSystem();

module.exports = cookieManager;
