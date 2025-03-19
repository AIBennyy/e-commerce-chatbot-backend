/**
 * Motonet E-Commerce Platform Adapter
 * Implements the platform-specific logic for Motonet
 */
const axios = require('axios');
const BaseECommerceAdapter = require('../base-adapter');

class MotonetAdapter extends BaseECommerceAdapter {
  /**
   * Create a new Motonet adapter instance
   * @param {Object} cookieManager - Cookie management system instance
   */
  constructor(cookieManager) {
    super(cookieManager);
    this.platformId = 'motonet';
    this.baseUrl = 'https://www.motonet.fi';
    this.apiBaseUrl = 'https://www.motonet.fi/api';
  }

  /**
   * Search for products on Motonet
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
          'Content-Type': 'application/json'
        },
        params: {
          q: query,
          page: options.page || 1,
          limit: options.limit || 20,
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
          'Content-Type': 'application/json'
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
      const price = productDetails.price || 119; // Default price if not available
      
      const response = await axios({
        method: 'post',
        url: `${this.apiBaseUrl}/tracking/add-to-cart`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json'
        },
        data: {
          currency: "EUR",
          value: price,
          items: [
            {
              item_id: productId,
              product_id: "542c6ba2-db43-46b6-89d8-a9af5f10dd6f" // This might need to be dynamic
            }
          ],
          coupons: []
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
          'Content-Type': 'application/json'
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
          'Content-Type': 'application/json'
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

module.exports = MotonetAdapter;
