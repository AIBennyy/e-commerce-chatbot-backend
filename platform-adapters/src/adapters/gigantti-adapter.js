/**
 * Gigantti E-Commerce Platform Adapter
 * Implements the platform-specific logic for Gigantti
 */
const axios = require('axios');
const BaseECommerceAdapter = require('../base-adapter');

class GiganttiAdapter extends BaseECommerceAdapter {
  /**
   * Create a new Gigantti adapter instance
   * @param {Object} cookieManager - Cookie management system instance
   */
  constructor(cookieManager) {
    super(cookieManager);
    this.platformId = 'gigantti';
    this.baseUrl = 'https://www.gigantti.fi';
    this.apiBaseUrl = 'https://www.gigantti.fi/api';
    this.cartPath = '/cart';
  }

  /**
   * Search for products on Gigantti
   * @param {string} query - Search query
   * @param {Object} options - Search options (pagination, filters, etc.)
   * @returns {Promise<Array>} - Array of product objects
   */
  async searchProducts(query, options = {}) {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.apiBaseUrl}/search`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        },
        params: {
          q: query,
          page: options.page || 1,
          pageSize: options.limit || 20,
          ...options.filters
        }
      });
      
      return response.data.products || [];
    } catch (error) {
      this.handleError(error, 'searchProducts');
    }
  }

  /**
   * Get detailed information about a product
   * @param {string} productId - Product identifier
   * @returns {Promise<Object>} - Product details
   */
  async getProductDetails(productId) {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.apiBaseUrl}/products/${productId}`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'getProductDetails');
    }
  }

  /**
   * Add a product to the cart
   * @param {string} productId - Product identifier
   * @param {number} quantity - Quantity to add (default: 1)
   * @returns {Promise<Object>} - Result of the operation
   */
  async addToCart(productId, quantity = 1) {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'post',
        url: `${this.apiBaseUrl}/cart/add`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/product/${productId}`
        },
        data: {
          productId: productId,
          quantity: quantity
        }
      });
      
      return {
        success: true,
        message: `Added ${quantity} of product ${productId} to cart`,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'addToCart');
    }
  }

  /**
   * Get the current contents of the cart
   * @returns {Promise<Object>} - Cart contents
   */
  async getCartContents() {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.apiBaseUrl}/cart`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        }
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'getCartContents');
    }
  }

  /**
   * Initiate the checkout process
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Result of the operation
   */
  async checkout(options = {}) {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'post',
        url: `${this.apiBaseUrl}/checkout/initiate`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/cart`
        },
        data: options
      });
      
      return {
        success: true,
        message: 'Checkout initiated',
        checkoutUrl: response.data.redirectUrl || `${this.baseUrl}/checkout`,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'checkout');
    }
  }
}

module.exports = GiganttiAdapter;
