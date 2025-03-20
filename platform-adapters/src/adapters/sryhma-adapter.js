/**
 * S-ryhmä E-Commerce Platform Adapter
 * Implements the platform-specific logic for S-ryhmä (S-kaupat)
 */
const axios = require('axios');
const BaseECommerceAdapter = require('../base-adapter');

class SRyhmaAdapter extends BaseECommerceAdapter {
  /**
   * Create a new S-ryhmä adapter instance
   * @param {Object} cookieManager - Cookie management system instance
   */
  constructor(cookieManager) {
    super(cookieManager);
    this.platformId = 'sryhma';
    this.baseUrl = 'https://www.s-kaupat.fi';
    this.apiBaseUrl = 'https://www.s-kaupat.fi/api';
  }

  /**
   * Search for products on S-ryhmä
   * @param {string} query - Search query
   * @param {Object} options - Search options (pagination, filters, etc.)
   * @returns {Promise<Array>} - Array of product objects
   */
  async searchProducts(query, options = {}) {
    try {
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.apiBaseUrl}/v2/products/search`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
        },
        params: {
          query: query,
          page: options.page || 1,
          pageSize: options.limit || 20,
          storeId: options.storeId || '',
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
        url: `${this.apiBaseUrl}/v2/products/${productId}`,
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
      
      // Get product details to determine price
      const productDetails = await this.getProductDetails(productId);
      
      const response = await axios({
        method: 'post',
        url: `${this.apiBaseUrl}/v2/cart/items`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/tuote/${productId}`
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
        url: `${this.apiBaseUrl}/v2/cart`,
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
        url: `${this.apiBaseUrl}/v2/checkout/initiate`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/ostoskori`
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

module.exports = SRyhmaAdapter;
