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
      console.log(`Searching for products with query: "${query}"`);
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/fi/search`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl,
          'Connection': 'keep-alive'
        },
        params: {
          q: query,
          page: options.page || 1,
          limit: options.limit || 20,
          ...options.filters
        },
        timeout: 10000
      });
      
      console.log(`Search results for "${query}":`, response.data);
      
      // Extract products from the response
      let products = [];
      if (response.data && response.data.products) {
        products = response.data.products;
      } else if (response.data && response.data.items) {
        products = response.data.items;
      }
      
      return products;
    } catch (error) {
      console.error(`Error searching for products with query "${query}":`, error);
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
      console.log(`Getting details for product ID: ${productId}`);
      const cookies = await this.getCookies();
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      console.log(`Formatted product ID: ${formattedProductId}`);
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/fi/tuote/${formattedProductId}`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl,
          'Connection': 'keep-alive'
        },
        timeout: 10000
      });
      
      console.log(`Product details for ${formattedProductId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting product details for ID ${productId}:`, error);
      // Don't throw here, just return a minimal object so addToCart can continue
      return { price: 0, id: productId };
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
      console.log(`Adding product ${productId} to cart (quantity: ${quantity})`);
      const cookies = await this.getCookies();
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      console.log(`Formatted product ID: ${formattedProductId}`);
      
      // Use the actual Motonet cart API endpoint
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/fi/cart/add`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
          'Referer': `${this.baseUrl}/fi/tuote/${formattedProductId}`,
          'Origin': this.baseUrl,
          'X-Requested-With': 'XMLHttpRequest',
          'Connection': 'keep-alive'
        },
        data: {
          productId: formattedProductId,
          quantity: quantity
        },
        timeout: 10000
      });
      
      console.log(`Add to cart response for ${formattedProductId}:`, response.data);
      
      // Also track the add to cart event for analytics (but don't fail if this fails)
      try {
        await axios({
          method: 'post',
          url: `${this.apiBaseUrl}/tracking/add-to-cart`,
          headers: {
            'Cookie': cookies.cookieString,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
            'Referer': `${this.baseUrl}/fi/tuote/${formattedProductId}`,
            'Origin': this.baseUrl,
            'Connection': 'keep-alive'
          },
          data: {
            currency: "EUR",
            value: 0,
            items: [
              {
                item_id: formattedProductId,
                product_id: formattedProductId
              }
            ],
            coupons: []
          },
          timeout: 5000
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
      console.error(`Error adding product ${productId} to cart:`, error);
      
      // Provide detailed error information
      const errorDetails = {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null,
        request: error.request ? 'Request was made but no response received' : null
      };
      
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      
      this.handleError(error, 'addToCart');
    }
  }

  /**
   * Get the current contents of the cart
   * @returns {Promise<Object>} - Cart contents
   */
  async getCartContents() {
    try {
      console.log('Getting cart contents');
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/fi/cart`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
          'Referer': this.baseUrl,
          'Origin': this.baseUrl,
          'Connection': 'keep-alive'
        },
        timeout: 10000
      });
      
      console.log('Cart contents:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting cart contents:', error);
      this.handleError(error, 'getCartContents');
    }
  }

  /**
   * Get the URL for the platform's shopping cart
   * @returns {Promise<string>} - URL to the shopping cart
   */
  async getCartUrl() {
    try {
      console.log('Getting cart URL');
      // Get cookies to ensure the session is maintained
      const cookies = await this.getCookies();
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      // Check if cartPath is defined
      if (!this.cartPath) {
        throw new Error(`Cart path not defined for ${this.platformId}`);
      }
      
      // Return the full cart URL
      const cartUrl = `${this.baseUrl}${this.cartPath}`;
      console.log(`Cart URL: ${cartUrl}`);
      return cartUrl;
    } catch (error) {
      console.error('Error getting cart URL:', error);
      throw error;
    }
  }

  /**
   * Initiate the checkout process
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Result of the operation
   */
  async checkout(options = {}) {
    try {
      console.log('Initiating checkout');
      const cookies = await this.getCookies();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/fi/checkout/initiate`,
        headers: {
          'Cookie': cookies.cookieString,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
          'Referer': `${this.baseUrl}/fi/ostoskori`,
          'Origin': this.baseUrl,
          'Connection': 'keep-alive'
        },
        data: options,
        timeout: 10000
      });
      
      console.log('Checkout response:', response.data);
      return {
        success: true,
        message: 'Checkout initiated',
        checkoutUrl: response.data.redirectUrl || `${this.baseUrl}/fi/checkout`,
        data: response.data
      };
    } catch (error) {
      console.error('Error initiating checkout:', error);
      this.handleError(error, 'checkout');
    }
  }
}

module.exports = MotonetAdapter;
