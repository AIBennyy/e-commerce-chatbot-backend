// Modified version of motonet-adapter.js with improved product ID handling and parameter naming
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
   * Get standard headers for API requests
   * @param {string} cookieString - Cookie string
   * @param {string} referer - Referer URL
   * @returns {Object} - Headers object
   */
  getStandardHeaders(cookieString, referer = this.baseUrl) {
    return {
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,fi;q=0.8',
      'Referer': referer,
      'Origin': this.baseUrl,
      'Connection': 'keep-alive',
      'X-Requested-With': 'XMLHttpRequest'
    };
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
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/fi/search`,
        headers: this.getStandardHeaders(cookies.cookieString),
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
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      console.log(`Formatted product ID: ${formattedProductId}`);
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/fi/tuote/${formattedProductId}`,
        headers: this.getStandardHeaders(cookies.cookieString),
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
      
      // Force cookie refresh before attempting to add to cart
      await this.cookieManager.refreshCookies(this.platformId);
      const cookies = await this.getCookies();
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      // Ensure product ID is in the correct format
      const formattedProductId = this.formatProductId(productId);
      console.log(`Formatted product ID: ${formattedProductId}`);
      
      // Try multiple formats for the product ID
      const productIdVariations = [
        formattedProductId,
        formattedProductId.replace('-', ''),  // Without hyphen
        productId  // Original format
      ];
      
      let lastError = null;
      
      // Try each product ID variation with each method
      for (const pidVariation of productIdVariations) {
        console.log(`Trying product ID variation: ${pidVariation}`);
        
        // Method 1: Direct cart API with 'id' parameter
        try {
          console.log(`Attempting to add product ${pidVariation} to cart using direct cart API with 'id' parameter`);
          const cartResponse = await axios({
            method: 'post',
            url: `${this.baseUrl}/fi/cart/add`,
            headers: {
              ...this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${pidVariation}`),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `id=${pidVariation}&quantity=${quantity}`,
            timeout: 15000
          });
          
          console.log(`Direct cart API response for ${pidVariation}:`, cartResponse.data);
          
          if (cartResponse.status === 200 || cartResponse.status === 201) {
            return {
              success: true,
              message: `Added ${quantity} of product ${pidVariation} to cart using 'id' parameter`,
              data: cartResponse.data
            };
          }
        } catch (error) {
          console.error(`Error with direct cart API using 'id' parameter for ${pidVariation}:`, error.message);
          lastError = error;
        }
        
        // Method 2: Direct cart API with 'productId' parameter
        try {
          console.log(`Attempting to add product ${pidVariation} to cart using direct cart API with 'productId' parameter`);
          const cartResponse2 = await axios({
            method: 'post',
            url: `${this.baseUrl}/fi/cart/add`,
            headers: {
              ...this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${pidVariation}`),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `productId=${pidVariation}&quantity=${quantity}`,
            timeout: 15000
          });
          
          console.log(`Direct cart API response with 'productId' parameter for ${pidVariation}:`, cartResponse2.data);
          
          if (cartResponse2.status === 200 || cartResponse2.status === 201) {
            return {
              success: true,
              message: `Added ${quantity} of product ${pidVariation} to cart using 'productId' parameter`,
              data: cartResponse2.data
            };
          }
        } catch (error) {
          console.error(`Error with direct cart API using 'productId' parameter for ${pidVariation}:`, error.message);
          lastError = error;
        }
        
        // Method 3: Form submission
        try {
          console.log(`Attempting to add product ${pidVariation} to cart using form submission`);
          const formResponse = await axios({
            method: 'post',
            url: `${this.baseUrl}/fi/tuote/${pidVariation}`,
            headers: {
              ...this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${pidVariation}`),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `quantity=${quantity}&add_to_cart=true`,
            timeout: 15000
          });
          
          console.log(`Form submission response for ${pidVariation}:`, formResponse.status);
          
          if (formResponse.status === 200 || formResponse.status === 201 || formResponse.status === 302) {
            return {
              success: true,
              message: `Added ${quantity} of product ${pidVariation} to cart using form submission`,
              data: { status: formResponse.status }
            };
          }
        } catch (error) {
          console.error(`Error with form submission for ${pidVariation}:`, error.message);
          lastError = error;
        }
        
        // Method 4: JSON API approach
        try {
          console.log(`Attempting to add product ${pidVariation} to cart using JSON API`);
          const jsonResponse = await axios({
            method: 'post',
            url: `${this.apiBaseUrl}/cart/add`,
            headers: {
              ...this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${pidVariation}`),
              'Content-Type': 'application/json'
            },
            data: JSON.stringify({
              productId: pidVariation,
              quantity: quantity
            }),
            timeout: 15000
          });
          
          console.log(`JSON API response for ${pidVariation}:`, jsonResponse.data);
          
          if (jsonResponse.status === 200 || jsonResponse.status === 201) {
            return {
              success: true,
              message: `Added ${quantity} of product ${pidVariation} to cart using JSON API`,
              data: jsonResponse.data
            };
          }
        } catch (error) {
          console.error(`Error with JSON API for ${pidVariation}:`, error.message);
          lastError = error;
        }
      }
      
      // Also try the tracking endpoint for analytics (but don't rely on it for cart addition)
      try {
        await axios({
          method: 'post',
          url: `${this.apiBaseUrl}/tracking/add-to-cart`,
          headers: this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${formattedProductId}`),
          data: {
            productId: formattedProductId,
            quantity: quantity
          },
          timeout: 5000
        });
        console.log(`Tracking request sent for ${formattedProductId}`);
      } catch (trackingError) {
        // Tracking errors shouldn't fail the whole operation
        console.warn(`Tracking request failed:`, trackingError.message);
      }
      
      // If all methods and variations fail, throw an error
      throw new Error(`Failed to add product ${formattedProductId} to cart using all available methods and variations`);
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
      
      // Handle the error
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
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}${this.cartPath}`,
        headers: this.getStandardHeaders(cookies.cookieString),
        timeout: 10000
      });
      
      console.log('Cart contents:', response.data);
      
      // Extract cart data from the response
      // This is a simplified implementation and may need to be adjusted
      // based on the actual structure of the response
      let cartData = {
        items: [],
        totalPrice: 0
      };
      
      // Parse the HTML response to extract cart data
      // This is a placeholder and should be implemented based on the actual HTML structure
      
      return cartData;
    } catch (error) {
      console.error('Error getting cart contents:', error);
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
      console.log('Initiating checkout process');
      const cookies = await this.getCookies();
      
      if (!cookies || !cookies.cookieString) {
        throw new Error('No valid cookies found for Motonet');
      }
      
      // This is a placeholder implementation
      // In a real implementation, this would navigate through the checkout process
      
      return {
        success: true,
        message: 'Checkout initiated',
        checkoutUrl: `${this.baseUrl}${this.cartPath}/checkout`
      };
    } catch (error) {
      console.error('Error initiating checkout:', error);
      this.handleError(error, 'checkout');
    }
  }
}

module.exports = MotonetAdapter;
