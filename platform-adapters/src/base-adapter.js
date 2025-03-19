/**
 * Base E-Commerce Adapter
 * Defines the interface that all platform-specific adapters must implement
 */
class BaseECommerceAdapter {
  /**
   * Create a new adapter instance
   * @param {Object} cookieManager - Cookie management system instance
   */
  constructor(cookieManager) {
    if (!cookieManager) {
      throw new Error('Cookie manager is required');
    }
    
    this.cookieManager = cookieManager;
    this.platformId = 'base'; // Override in subclasses
    this.baseUrl = ''; // Override in subclasses
  }

  /**
   * Get fresh cookies for the platform
   * @returns {Promise<Object>} - Cookie data
   */
  async getCookies() {
    const cookies = await this.cookieManager.getLatestCookies(this.platformId);
    if (!cookies) {
      throw new Error(`No valid cookies found for ${this.platformId}`);
    }
    return cookies;
  }

  /**
   * Search for products on the platform
   * @param {string} query - Search query
   * @param {Object} options - Search options (pagination, filters, etc.)
   * @returns {Promise<Array>} - Array of product objects
   */
  async searchProducts(query, options = {}) {
    throw new Error(`searchProducts not implemented for ${this.platformId}`);
  }

  /**
   * Get detailed information about a product
   * @param {string} productId - Product identifier
   * @returns {Promise<Object>} - Product details
   */
  async getProductDetails(productId) {
    throw new Error(`getProductDetails not implemented for ${this.platformId}`);
  }

  /**
   * Add a product to the cart
   * @param {string} productId - Product identifier
   * @param {number} quantity - Quantity to add (default: 1)
   * @returns {Promise<Object>} - Result of the operation
   */
  async addToCart(productId, quantity = 1) {
    throw new Error(`addToCart not implemented for ${this.platformId}`);
  }

  /**
   * Get the current contents of the cart
   * @returns {Promise<Object>} - Cart contents
   */
  async getCartContents() {
    throw new Error(`getCartContents not implemented for ${this.platformId}`);
  }

  /**
   * Initiate the checkout process
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Result of the operation
   */
  async checkout(options = {}) {
    throw new Error(`checkout not implemented for ${this.platformId}`);
  }

  /**
   * Handle errors in a consistent way
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that caused the error
   * @throws {Error} - Rethrows the error with additional context
   */
  handleError(error, operation) {
    console.error(`Error in ${this.platformId} adapter during ${operation}:`, error);
    
    // Add platform-specific context to the error
    const enhancedError = new Error(
      `${this.platformId} ${operation} failed: ${error.message}`
    );
    enhancedError.originalError = error;
    enhancedError.platformId = this.platformId;
    enhancedError.operation = operation;
    
    throw enhancedError;
  }
}

module.exports = BaseECommerceAdapter;
