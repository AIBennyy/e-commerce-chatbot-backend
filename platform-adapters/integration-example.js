/**
 * Integration example for the e-commerce chatbot backend
 * Shows how to use the platform adapters with the cookie management system
 */

// Import the cookie management system
const cookieManagementSystem = require('../cookie-management-system');

// Import the platform adapters
const { createAdapterFactory } = require('../platform-adapters/src');

/**
 * Example of how to integrate the platform adapters with the e-commerce chatbot backend
 */
async function setupECommerceIntegration(app) {
  // Start the cookie management system
  await cookieManagementSystem.start();
  
  // Create the adapter factory
  const adapterFactory = createAdapterFactory(cookieManagementSystem);
  
  // Set up API endpoints
  
  // Add to cart endpoint
  app.post('/api/add-to-cart', async (req, res) => {
    try {
      const { productId, quantity = 1, platform = 'motonet' } = req.body;
      
      // Get the appropriate adapter for the platform
      const adapter = adapterFactory.getAdapter(platform);
      
      // Use the adapter to add the product to cart
      const result = await adapter.addToCart(productId, quantity);
      
      res.json(result);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Search products endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { query, platform = 'motonet', page, limit } = req.query;
      
      // Get the appropriate adapter for the platform
      const adapter = adapterFactory.getAdapter(platform);
      
      // Use the adapter to search for products
      const products = await adapter.searchProducts(query, { page, limit });
      
      res.json({ products });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get product details endpoint
  app.get('/api/products/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const { platform = 'motonet' } = req.query;
      
      // Get the appropriate adapter for the platform
      const adapter = adapterFactory.getAdapter(platform);
      
      // Use the adapter to get product details
      const product = await adapter.getProductDetails(productId);
      
      res.json(product);
    } catch (error) {
      console.error('Error getting product details:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get cart contents endpoint
  app.get('/api/cart', async (req, res) => {
    try {
      const { platform = 'motonet' } = req.query;
      
      // Get the appropriate adapter for the platform
      const adapter = adapterFactory.getAdapter(platform);
      
      // Use the adapter to get cart contents
      const cart = await adapter.getCartContents();
      
      res.json(cart);
    } catch (error) {
      console.error('Error getting cart contents:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Checkout endpoint
  app.post('/api/checkout', async (req, res) => {
    try {
      const { platform = 'motonet', options = {} } = req.body;
      
      // Get the appropriate adapter for the platform
      const adapter = adapterFactory.getAdapter(platform);
      
      // Use the adapter to initiate checkout
      const result = await adapter.checkout(options);
      
      res.json(result);
    } catch (error) {
      console.error('Error initiating checkout:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get supported platforms endpoint
  app.get('/api/platforms', (req, res) => {
    const platforms = adapterFactory.getSupportedPlatforms();
    res.json({ platforms });
  });
  
  console.log('E-commerce integration set up successfully');
}

module.exports = setupECommerceIntegration;
