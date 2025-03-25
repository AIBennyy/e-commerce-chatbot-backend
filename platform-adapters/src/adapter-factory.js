/**
 * E-Commerce Adapter Factory
 * Creates and manages platform-specific adapter instances
 */
const MotonetAdapter = require('./adapters/motonet-adapter');
const SRyhmaAdapter = require('./adapters/sryhma-adapter');
const GiganttiAdapter = require('./adapters/gigantti-adapter');

class ECommerceAdapterFactory {
  /**
   * Create a new adapter factory
   * @param {Object} cookieManager - Cookie management system instance
   */
  constructor(cookieManager) {
    if (!cookieManager) {
      throw new Error('Cookie manager is required');
    }
    
    this.cookieManager = cookieManager;
    this.adapters = {};
  }

  /**
   * Get an adapter for the specified platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   * @returns {Object} - Platform-specific adapter instance
   */
  getAdapter(platform) {
    // Return existing adapter instance if available
    if (this.adapters[platform]) {
      return this.adapters[platform];
    }
    
    // Create a new adapter instance based on the platform
    switch (platform.toLowerCase()) {
      case 'motonet':
        this.adapters[platform] = new MotonetAdapter(this.cookieManager);
        break;
        
      case 'sryhma':
        this.adapters[platform] = new SRyhmaAdapter(this.cookieManager);
        break;
        
      case 'gigantti':
        this.adapters[platform] = new GiganttiAdapter(this.cookieManager);
        break;
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    return this.adapters[platform];
  }

  /**
   * Get a list of supported platforms
   * @returns {Array} - Array of supported platform identifiers
   */
  getSupportedPlatforms() {
    return ['motonet', 'sryhma', 'gigantti']; // Add others as they are implemented
  }

  /**
   * Clear adapter instances (useful for testing)
   */
  clearAdapters() {
    this.adapters = {};
  }
}

module.exports = ECommerceAdapterFactory;
