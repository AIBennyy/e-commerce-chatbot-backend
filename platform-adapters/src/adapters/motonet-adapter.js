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
    this.cartPath = '/fi/ostoskori';
  }

  /**
   * Format product ID to ensure it matches Motonet's format (XX-XXXXX)
   * @param {string} productId - Product identifier
   * @returns {string} - Formatted product ID
   */
  formatProductId(productId) {
    // If product ID already contains a hyphen, assume it's correctly formatted
    if (productId.includes('-')) {
      return productId;
    }
    
    // Try to format as XX-XXXXX
    if (/^\d+$/.test(productId)) {
      if (productId.length >= 7) {
        // If it's a long number, assume first 2 digits are the prefix
        return `${productId.substring(0, 2)}-${productId.substring(2)}`;
      } else if (productId.length >= 5) {
        // For shorter numbers, use best guess
        return `${productId.substring(0, 2)}-${productId.substring(2)}`;
      }
    }
    
    // If we can't format it properly, return as is
    return productId;
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
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl
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
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      
      const response = await axios({
        method: 'get',
        url: `${this.apiBaseUrl}/products/${formattedProductId}`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl
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
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      
      // First, try to get product details to determine price and other info
      let productDetails;
      try {
        productDetails = await this.getProductDetails(formattedProductId);
      } catch (error) {
        console.warn(`Could not get product details for ${formattedProductId}, using default values`);
        productDetails = { price: 0 };
      }
      
      // Use the actual Motonet cart API endpoint
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/fi/cart/add`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': `${this.baseUrl}/fi/tuote/${formattedProductId}`,
          'Origin': this.baseUrl,
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
          productId: formattedProductId,
          quantity: quantity
        }
      });
      
      // Also track the add to cart event for analytics
      try {
        await axios({
          method: 'post',
          url: `${this.apiBaseUrl}/tracking/add-to-cart`,
          headers: {
            'Cookie': cookies.cookieString,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Referer': `${this.baseUrl}/fi/tuote/${formattedProductId}`,
            'Origin': this.baseUrl
          },
          data: {
            currency: "EUR",
            value: productDetails.price || 0,
            items: [
              {
                item_id: formattedProductId,
                product_id: formattedProductId
              }
            ],
            coupons: []
          }
        });
      } catch (trackingError) {
        // Tracking errors shouldn't fail the whole operation
        console.warn('Tracking request failed:', trackingError.message);
      }
      
      return {
        success: true,
        message: `Added ${quantity} of product ${formattedProductId} to cart`,
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
        url: `${this.baseUrl}/fi/cart`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl
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
        url: `${this.baseUrl}/fi/checkout/initiate`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Referer': `${this.baseUrl}/fi/ostoskori`,
          'Origin': this.baseUrl
        },
        data: options
      });
      
      return {
        success: true,
        message: 'Checkout initiated',
        checkoutUrl: response.data.redirectUrl || `${this.baseUrl}/fi/checkout`,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'checkout');
    }
  }
}

module.exports = MotonetAdapter;
