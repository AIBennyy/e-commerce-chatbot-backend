/**
 * API endpoint to get the cart URL for a specific platform
 * This file adds a new endpoint to the backend API to support the "Open my cart" button
 */
const express = require('express');
const router = express.Router();
const { createAdapterFactory } = require('../platform-adapters/src');
const cookieManager = require('../cookie-management-system');

// Create adapter factory
const adapterFactory = createAdapterFactory(cookieManager);

/**
 * GET /api/cart/url
 * Returns the URL to the shopping cart for the specified platform
 */
router.get('/url', async (req, res) => {
  try {
    const { platform } = req.query;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter is required' });
    }
    
    console.log(`Getting cart URL for platform: ${platform}`);
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Get the cart URL
    const cartUrl = await adapter.getCartUrl();
    
    console.log(`Cart URL for ${platform}: ${cartUrl}`);
    
    // Return the cart URL
    res.json({ cartUrl });
  } catch (error) {
    console.error('Error getting cart URL:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      platformId: error.platformId || 'unknown',
      operation: error.operation || 'getCartUrl'
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    res.status(500).json({ 
      error: 'Failed to get cart URL', 
      message: error.message,
      details: errorDetails
    });
  }
});

/**
 * POST /api/cart/add
 * Adds a product to the cart for the specified platform
 */
router.post('/add', async (req, res) => {
  try {
    const { platform, productId, quantity = 1 } = req.body;
    
    if (!platform || !productId) {
      return res.status(400).json({ error: 'Platform and productId parameters are required' });
    }
    
    console.log(`Adding product ${productId} to cart for platform: ${platform} (quantity: ${quantity})`);
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Add the product to the cart
    const result = await adapter.addToCart(productId, quantity);
    
    console.log(`Add to cart result for ${productId}:`, result);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      platformId: error.platformId || 'unknown',
      operation: error.operation || 'addToCart'
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    res.status(500).json({ 
      error: 'Failed to add product to cart', 
      message: error.message,
      details: errorDetails
    });
  }
});

/**
 * GET /api/cart/contents
 * Returns the contents of the cart for the specified platform
 */
router.get('/contents', async (req, res) => {
  try {
    const { platform } = req.query;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter is required' });
    }
    
    console.log(`Getting cart contents for platform: ${platform}`);
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Get the cart contents
    const cartContents = await adapter.getCartContents();
    
    console.log(`Cart contents for ${platform}:`, cartContents);
    
    // Return the cart contents
    res.json(cartContents);
  } catch (error) {
    console.error('Error getting cart contents:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      platformId: error.platformId || 'unknown',
      operation: error.operation || 'getCartContents'
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    res.status(500).json({ 
      error: 'Failed to get cart contents', 
      message: error.message,
      details: errorDetails
    });
  }
});

/**
 * GET /api/cart/search
 * Searches for products on the specified platform
 */
router.get('/search', async (req, res) => {
  try {
    const { platform, query, page = 1, limit = 20 } = req.query;
    
    if (!platform || !query) {
      return res.status(400).json({ error: 'Platform and query parameters are required' });
    }
    
    console.log(`Searching for products on platform: ${platform}, query: "${query}"`);
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Search for products
    const products = await adapter.searchProducts(query, { page, limit });
    
    console.log(`Found ${products.length} products for query "${query}" on ${platform}`);
    
    // Return the products
    res.json({ products });
  } catch (error) {
    console.error('Error searching for products:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      platformId: error.platformId || 'unknown',
      operation: error.operation || 'searchProducts'
    };
    
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    res.status(500).json({ 
      error: 'Failed to search for products', 
      message: error.message,
      details: errorDetails
    });
  }
});

module.exports = router;
