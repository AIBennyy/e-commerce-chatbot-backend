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
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Get the cart URL
    const cartUrl = await adapter.getCartUrl();
    
    // Return the cart URL
    res.json({ cartUrl });
  } catch (error) {
    console.error('Error getting cart URL:', error);
    res.status(500).json({ error: 'Failed to get cart URL', message: error.message });
  }
});

module.exports = router;
